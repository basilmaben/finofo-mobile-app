/**
 * File Batch Store
 * Manages file batch state and upload progress across screens
 * Integrates with UploadManager for resumable uploads
 */

import { useAuth } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useToast } from '@/components/Toast';
import { checkForDuplicate } from '@/services/fileChecksum';
import { getUploadManager, type BatchUploadProgress, type FileUploadItem } from '@/services/uploadManager';
import {
  clearBatchState,
  loadBatchState,
  saveBatchState,
  type PersistedBatch,
  type PersistedFile,
} from '@/services/uploadPersistence';
import { useActivity } from '@/store/activity-store';
import type { DocumentFile } from '@/types/document';

type UploadStatus = 'idle' | 'uploading' | 'paused' | 'completed' | 'error';

interface UploadState {
  status: UploadStatus;
  progress: number;
  currentFile?: number;
  totalFiles?: number;
  error?: string;
  canResume?: boolean;
  bytesPerSecond?: number;
  estimatedTimeRemaining?: number;
}

interface FileBatchContextType {
  files: DocumentFile[];
  addFiles: (files: DocumentFile[]) => Promise<void>;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setFiles: (files: DocumentFile[]) => void;
  // Upload state
  uploadState: UploadState;
  startUpload: () => Promise<void>;
  pauseUpload: () => void;
  resumeUpload: () => Promise<void>;
  cancelUpload: () => Promise<void>;
  retryUpload: () => Promise<void>;
}

const FileBatchContext = createContext<FileBatchContextType | null>(null);

export function FileBatchProvider({ children }: { children: ReactNode }) {
  const [files, setFilesState] = useState<DocumentFile[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
  });
  const { getToken } = useAuth();
  const { saveUploadedFiles } = useActivity();
  const toast = useToast();
  
  // Get the upload manager singleton
  const uploadManager = getUploadManager();

  // Load persisted batch on mount
  useEffect(() => {
    const loadPersistedBatch = async () => {
      const batch = await loadBatchState();
      if (batch && batch.files.length > 0) {
        // Only restore files that weren't completed
        const pendingFiles = batch.files.filter((f) => f.status !== 'completed');
        if (pendingFiles.length > 0) {
          const docFiles: DocumentFile[] = pendingFiles.map((f) => ({
            id: f.id,
            uri: f.uri,
            name: f.name,
            type: f.type,
            size: f.size,
            createdAt: new Date(),
          }));
          setFilesState(docFiles);
          
          // Add to upload manager
          uploadManager.addFiles(
            pendingFiles.map((f) => ({
              uri: f.uri,
              name: f.name,
              type: f.type,
              size: f.size,
            }))
          );

          // Show toast if there are resumable files
          toast.info(
            `You have ${pendingFiles.length} file${pendingFiles.length !== 1 ? 's' : ''} ready to upload.`,
            'Resume Upload'
          );
        }
      }
    };
    loadPersistedBatch();
  }, []);

  // Persist batch state when files change
  useEffect(() => {
    const persistBatch = async () => {
      if (files.length === 0) {
        await clearBatchState();
        return;
      }

      const managerFiles = uploadManager.getFiles();
      const persistedFiles: PersistedFile[] = files.map((f) => {
        const managerFile = managerFiles.find((mf) => mf.name === f.name);
        return {
          id: f.id,
          uri: f.uri,
          name: f.name,
          type: f.type,
          size: f.size,
          status: managerFile?.status || 'pending',
          progress: managerFile?.progress || 0,
          sessionId: managerFile?.sessionId,
        };
      });

      const batch: PersistedBatch = {
        files: persistedFiles,
        createdAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      };
      await saveBatchState(batch);
    };
    persistBatch();
  }, [files, uploadState]);

  // Subscribe to upload progress updates
  useEffect(() => {
    const unsubscribe = uploadManager.onProgress((progress: BatchUploadProgress) => {
      setUploadState({
        status: mapProgressStatus(progress.status),
        progress: progress.overallProgress,
        currentFile: progress.currentFileIndex + 1,
        totalFiles: progress.totalFiles,
        canResume: progress.canResume,
      });
    });

    return () => unsubscribe();
  }, [uploadManager]);

  // Map UploadManager status to our status type
  const mapProgressStatus = (status: BatchUploadProgress['status']): UploadStatus => {
    switch (status) {
      case 'idle':
        return 'idle';
      case 'uploading':
        return 'uploading';
      case 'paused':
        return 'paused';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'error';
      default:
        return 'idle';
    }
  };

  const addFiles = useCallback(async (newFiles: DocumentFile[]) => {
    const filesToAdd: DocumentFile[] = [];
    const duplicates: { newFile: DocumentFile; existingName: string }[] = [];

    // Check each file for duplicates
    for (const newFile of newFiles) {
      const result = await checkForDuplicate(
        { name: newFile.name, size: newFile.size, type: newFile.type },
        files.map((f) => ({ id: f.id, name: f.name, size: f.size, type: f.type }))
      );

      if (result.isDuplicate && result.existingFileName) {
        duplicates.push({ newFile, existingName: result.existingFileName });
      } else {
        filesToAdd.push(newFile);
      }
    }

    // Handle duplicates
    if (duplicates.length > 0) {
      const duplicateNames = duplicates.map((d) => d.newFile.name).join(', ');
      
      Alert.alert(
        'Duplicate Files Detected',
        `The following files already exist in the batch:\n\n${duplicateNames}\n\nWhat would you like to do?`,
        [
          {
            text: 'Skip Duplicates',
            style: 'cancel',
            onPress: () => {
              // Only add non-duplicate files
              if (filesToAdd.length > 0) {
                setFilesState((prev) => [...prev, ...filesToAdd]);
                uploadManager.addFiles(
                  filesToAdd.map((f) => ({
                    uri: f.uri,
                    name: f.name,
                    type: f.type,
                    size: f.size,
                  }))
                );
                toast.info(`Added ${filesToAdd.length} file(s), skipped ${duplicates.length} duplicate(s).`);
              } else {
                toast.info('All files were duplicates and skipped.');
              }
            },
          },
          {
            text: 'Replace All',
            onPress: () => {
              // Remove existing duplicates and add all new files
              const duplicateIds = duplicates
                .map((d) => {
                  const existing = files.find((f) => f.name === d.existingName || 
                    (f.size === d.newFile.size && f.type === d.newFile.type));
                  return existing?.id;
                })
                .filter(Boolean) as string[];

              setFilesState((prev) => {
                const filtered = prev.filter((f) => !duplicateIds.includes(f.id));
                return [...filtered, ...newFiles];
              });

              // Update upload manager
              duplicateIds.forEach((id) => uploadManager.removeFile(id));
              uploadManager.addFiles(
                newFiles.map((f) => ({
                  uri: f.uri,
                  name: f.name,
                  type: f.type,
                  size: f.size,
                }))
              );
              toast.success(`Replaced ${duplicates.length} file(s).`);
            },
          },
        ]
      );
    } else {
      // No duplicates, add all files
      setFilesState((prev) => [...prev, ...newFiles]);
      uploadManager.addFiles(
        newFiles.map((f) => ({
          uri: f.uri,
          name: f.name,
          type: f.type,
          size: f.size,
        }))
      );
    }
  }, [files, uploadManager, toast]);

  const removeFile = useCallback((id: string) => {
    setFilesState((prev) => prev.filter((f) => f.id !== id));
    uploadManager.removeFile(id);
  }, [uploadManager]);

  const clearFiles = useCallback(() => {
    setFilesState([]);
    uploadManager.clear();
    setUploadState({ status: 'idle', progress: 0 });
  }, [uploadManager]);

  const setFiles = useCallback((newFiles: DocumentFile[]) => {
    setFilesState(newFiles);
    
    // Clear and re-add to upload manager
    uploadManager.clear();
    uploadManager.addFiles(
      newFiles.map((f) => ({
        uri: f.uri,
        name: f.name,
        type: f.type,
        size: f.size,
      }))
    );
  }, [uploadManager]);

  const startUpload = useCallback(async () => {
    if (files.length === 0) return;

    setUploadState({
      status: 'uploading',
      progress: 0,
      totalFiles: files.length,
      currentFile: 1,
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Show loading toast
    const loadingToastId = toast.loading(
      `Uploading ${files.length} file${files.length !== 1 ? 's' : ''}...`,
      'Upload in Progress'
    );

    try {
      const token = await getToken();
      uploadManager.setToken(token);

      const result = await uploadManager.start();

      // Hide loading toast
      toast.hide(loadingToastId);

      if (result.success) {
        setUploadState({
          status: 'completed',
          progress: 100,
          totalFiles: files.length,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Show success toast
        toast.success(
          `${files.length} file${files.length !== 1 ? 's' : ''} uploaded successfully!`,
          'Upload Complete'
        );

        // Save files to encrypted local storage for Activity tab
        try {
          await saveUploadedFiles(files, result.uploadJobId);
        } catch (saveError) {
          console.error('Error saving files to activity:', saveError);
        }

        // Clear files after short delay
        setTimeout(async () => {
          setFilesState([]);
          uploadManager.clear();
          setUploadState({ status: 'idle', progress: 0 });
          await clearBatchState(); // Clear persisted state on success
        }, 2000);
      } else {
        const failedCount = result.failedFiles.length;
        const successCount = result.completedFiles.length;

        if (successCount > 0) {
          // Partial success
          setUploadState({
            status: 'error',
            progress: Math.round((successCount / files.length) * 100),
            error: `${failedCount} file${failedCount !== 1 ? 's' : ''} failed`,
            canResume: true,
          });

          toast.warning(
            `${successCount} uploaded, ${failedCount} failed. Tap to retry.`,
            'Partial Upload'
          );

          // Save successful files
          const completedDocFiles = files.filter((f) =>
            result.completedFiles.some((cf) => cf.name === f.name)
          );
          if (completedDocFiles.length > 0) {
            await saveUploadedFiles(completedDocFiles, result.uploadJobId);
          }
        } else {
          // Complete failure
          setUploadState({
            status: 'error',
            progress: 0,
            error: 'Upload failed',
            canResume: true,
          });

          toast.error(
            'Upload failed. Please try again.',
            'Upload Failed'
          );
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      toast.hide(loadingToastId);

      setUploadState({
        status: 'error',
        progress: 0,
        error: 'Upload failed',
        canResume: true,
      });

      toast.error('Upload failed. Please try again.', 'Upload Failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [files, getToken, saveUploadedFiles, toast, uploadManager]);

  const pauseUpload = useCallback(() => {
    uploadManager.pause();
    toast.info('Upload paused. Resume when ready.', 'Paused');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [toast, uploadManager]);

  const resumeUpload = useCallback(async () => {
    if (uploadState.status !== 'paused' && uploadState.status !== 'error') return;

    const loadingToastId = toast.loading('Resuming upload...', 'Resuming');

    try {
      const token = await getToken();
      uploadManager.setToken(token);

      const result = await uploadManager.resume();

      toast.hide(loadingToastId);

      if (result.success) {
        toast.success('Upload completed!', 'Success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Save files to activity
        await saveUploadedFiles(files, result.uploadJobId);

        setTimeout(() => {
          setFilesState([]);
          uploadManager.clear();
          setUploadState({ status: 'idle', progress: 0 });
        }, 2000);
      }
    } catch (error) {
      toast.hide(loadingToastId);
      toast.error('Upload failed. Please try again.', 'Upload Failed');
    }
  }, [files, getToken, saveUploadedFiles, toast, uploadManager, uploadState.status]);

  const retryUpload = useCallback(async () => {
    if (uploadState.status !== 'error') return;

    const loadingToastId = toast.loading('Retrying failed uploads...', 'Retrying');

    try {
      const token = await getToken();
      uploadManager.setToken(token);

      const result = await uploadManager.retry();

      toast.hide(loadingToastId);

      if (result.success) {
        toast.success('All files uploaded!', 'Success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        await saveUploadedFiles(files, result.uploadJobId);

        setTimeout(() => {
          setFilesState([]);
          uploadManager.clear();
          setUploadState({ status: 'idle', progress: 0 });
        }, 2000);
      } else {
        toast.error('Upload failed. Please try again.', 'Upload Failed');
      }
    } catch (error) {
      toast.hide(loadingToastId);
      toast.error('Upload failed. Please try again.', 'Upload Failed');
    }
  }, [files, getToken, saveUploadedFiles, toast, uploadManager, uploadState.status]);

  const cancelUpload = useCallback(async () => {
    uploadManager.cancel();
    setUploadState({ status: 'idle', progress: 0 });
    setFilesState([]);
    await clearBatchState(); // Clear persisted state
    toast.info('Upload cancelled', 'Cancelled');
  }, [toast, uploadManager]);

  return (
    <FileBatchContext.Provider 
      value={{ 
        files, 
        addFiles, 
        removeFile, 
        clearFiles, 
        setFiles,
        uploadState,
        startUpload,
        pauseUpload,
        resumeUpload,
        cancelUpload,
        retryUpload,
      }}
    >
      {children}
    </FileBatchContext.Provider>
  );
}

export function useFileBatch() {
  const context = useContext(FileBatchContext);
  if (!context) {
    throw new Error('useFileBatch must be used within a FileBatchProvider');
  }
  return context;
}
