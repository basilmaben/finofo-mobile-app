/**
 * Activity Store
 * Manages locally saved files that are displayed in the Activity tab
 * Files are encrypted with the user's Clerk ID for security
 */

import { useAuth } from '@clerk/clerk-expo';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import {
  cleanupTempFiles,
  deleteEncryptedFile,
  getDecryptedFileUri,
  loadActivityFilesMetadata,
  saveActivityFilesMetadata,
  saveEncryptedFile,
  type SavedFile,
} from '@/services/encryptedStorage';
import type { DocumentFile } from '@/types/document';

interface ActivityContextType {
  savedFiles: SavedFile[];
  isLoading: boolean;
  saveUploadedFiles: (files: DocumentFile[], uploadJobId?: string) => Promise<void>;
  removeSavedFile: (id: string) => Promise<void>;
  getFileUri: (file: SavedFile) => Promise<string>;
  refreshFiles: () => Promise<void>;
}

const ActivityContext = createContext<ActivityContextType | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userId, isSignedIn } = useAuth();

  // Load saved files when user signs in
  useEffect(() => {
    if (isSignedIn && userId) {
      loadFiles();
    } else {
      setSavedFiles([]);
      setIsLoading(false);
    }

    // Cleanup temp files on mount
    cleanupTempFiles();
  }, [isSignedIn, userId]);

  const loadFiles = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const files = await loadActivityFilesMetadata(userId);
      // Sort by upload date (newest first)
      files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      setSavedFiles(files);
    } catch (error) {
      console.error('Error loading activity files:', error);
      setSavedFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const refreshFiles = useCallback(async () => {
    await loadFiles();
  }, [loadFiles]);

  const saveUploadedFiles = useCallback(async (
    files: DocumentFile[],
    uploadJobId?: string
  ) => {
    if (!userId) {
      console.warn('Cannot save files: User not authenticated');
      return;
    }

    try {
      const newSavedFiles: SavedFile[] = [];

      for (const file of files) {
        const savedFile = await saveEncryptedFile(
          file.uri,
          file.name,
          file.type,
          file.size,
          userId,
          uploadJobId
        );
        newSavedFiles.push(savedFile);
      }

      // Add to existing files and save metadata
      const updatedFiles = [...newSavedFiles, ...savedFiles];
      setSavedFiles(updatedFiles);
      await saveActivityFilesMetadata(updatedFiles, userId);
    } catch (error) {
      console.error('Error saving uploaded files:', error);
      throw error;
    }
  }, [userId, savedFiles]);

  const removeSavedFile = useCallback(async (id: string) => {
    if (!userId) return;

    try {
      const fileToRemove = savedFiles.find(f => f.id === id);
      if (fileToRemove) {
        // Delete the encrypted file
        await deleteEncryptedFile(fileToRemove.encryptedUri);
        
        // Remove from list and update metadata
        const updatedFiles = savedFiles.filter(f => f.id !== id);
        setSavedFiles(updatedFiles);
        await saveActivityFilesMetadata(updatedFiles, userId);
      }
    } catch (error) {
      console.error('Error removing saved file:', error);
      throw error;
    }
  }, [userId, savedFiles]);

  const getFileUri = useCallback(async (file: SavedFile): Promise<string> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return getDecryptedFileUri(file, userId);
  }, [userId]);

  return (
    <ActivityContext.Provider
      value={{
        savedFiles,
        isLoading,
        saveUploadedFiles,
        removeSavedFile,
        getFileUri,
        refreshFiles,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
}

