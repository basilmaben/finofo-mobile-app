/**
 * File Batch Store
 * Manages file batch state and upload progress across screens
 */

import { useAuth } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import { uploadFiles, type UploadProgress } from '@/api/upload';
import type { DocumentFile } from '@/types/document';

type UploadStatus = 'idle' | 'uploading' | 'completed' | 'error';

interface UploadState {
  status: UploadStatus;
  progress: number;
  currentFile?: number;
  totalFiles?: number;
  error?: string;
}

interface FileBatchContextType {
  files: DocumentFile[];
  addFiles: (files: DocumentFile[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setFiles: (files: DocumentFile[]) => void;
  // Upload state
  uploadState: UploadState;
  startUpload: () => Promise<void>;
  cancelUpload: () => void;
}

const FileBatchContext = createContext<FileBatchContextType | null>(null);

export function FileBatchProvider({ children }: { children: ReactNode }) {
  const [files, setFilesState] = useState<DocumentFile[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
  });
  const { getToken } = useAuth();

  const addFiles = useCallback((newFiles: DocumentFile[]) => {
    setFilesState((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFilesState((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearFiles = useCallback(() => {
    setFilesState([]);
    setUploadState({ status: 'idle', progress: 0 });
  }, []);

  const setFiles = useCallback((newFiles: DocumentFile[]) => {
    setFilesState(newFiles);
  }, []);

  const startUpload = useCallback(async () => {
    if (files.length === 0) return;

    setUploadState({
      status: 'uploading',
      progress: 0,
      totalFiles: files.length,
      currentFile: 1,
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token = await getToken();

      const filesToUpload = files.map(f => ({
        uri: f.uri,
        name: f.name,
        type: f.type,
        size: f.size,
      }));

      const result = await uploadFiles(filesToUpload, {
        token,
        onProgress: (progress: UploadProgress) => {
          setUploadState(prev => ({
            ...prev,
            progress: progress.progress,
            currentFile: progress.currentFile,
            totalFiles: progress.totalFiles,
            error: progress.error,
            status: progress.phase === 'error' ? 'error' : 'uploading',
          }));
        },
      });

      if (result.success) {
        setUploadState({
          status: 'completed',
          progress: 100,
          totalFiles: files.length,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Clear files after short delay
        setTimeout(() => {
          setFilesState([]);
          setUploadState({ status: 'idle', progress: 0 });
        }, 2000);
      } else {
        setUploadState({
          status: 'error',
          progress: 0,
          error: result.error,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState({
        status: 'error',
        progress: 0,
        error: errorMessage,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [files, getToken]);

  const cancelUpload = useCallback(() => {
    setUploadState({ status: 'idle', progress: 0 });
    setFilesState([]);
  }, []);

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
        cancelUpload,
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
