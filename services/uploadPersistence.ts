/**
 * Upload Persistence Service
 * Persists upload batch state locally for resume capability
 * Uses Expo SecureStore for storage
 */

import * as SecureStore from 'expo-secure-store';

const UPLOAD_BATCH_KEY = 'finofo_upload_batch';

export interface PersistedFile {
  id: string;
  uri: string;
  name: string;
  type: string;
  size: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'paused';
  progress: number;
  sessionId?: string;
}

export interface PersistedBatch {
  files: PersistedFile[];
  createdAt: string;
  lastUpdatedAt: string;
  uploadJobId?: string;
}

/**
 * Save current batch state to local storage
 */
export const saveBatchState = async (batch: PersistedBatch): Promise<void> => {
  try {
    const data = JSON.stringify(batch);
    await SecureStore.setItemAsync(UPLOAD_BATCH_KEY, data);
  } catch (error) {
    console.error('Failed to save batch state:', error);
  }
};

/**
 * Load persisted batch state
 */
export const loadBatchState = async (): Promise<PersistedBatch | null> => {
  try {
    const data = await SecureStore.getItemAsync(UPLOAD_BATCH_KEY);
    if (data) {
      return JSON.parse(data) as PersistedBatch;
    }
    return null;
  } catch (error) {
    console.error('Failed to load batch state:', error);
    return null;
  }
};

/**
 * Clear persisted batch state
 */
export const clearBatchState = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(UPLOAD_BATCH_KEY);
  } catch (error) {
    console.error('Failed to clear batch state:', error);
  }
};

/**
 * Update a single file's status in the persisted batch
 */
export const updateFileInBatch = async (
  fileId: string,
  updates: Partial<PersistedFile>
): Promise<void> => {
  try {
    const batch = await loadBatchState();
    if (batch) {
      const fileIndex = batch.files.findIndex((f) => f.id === fileId);
      if (fileIndex !== -1) {
        batch.files[fileIndex] = { ...batch.files[fileIndex], ...updates };
        batch.lastUpdatedAt = new Date().toISOString();
        await saveBatchState(batch);
      }
    }
  } catch (error) {
    console.error('Failed to update file in batch:', error);
  }
};

/**
 * Check if there's a resumable batch (has pending/paused files)
 */
export const hasResumableBatch = async (): Promise<boolean> => {
  try {
    const batch = await loadBatchState();
    if (!batch) return false;
    
    return batch.files.some(
      (f) => f.status === 'pending' || f.status === 'paused' || f.status === 'uploading'
    );
  } catch (error) {
    console.error('Failed to check resumable batch:', error);
    return false;
  }
};

/**
 * Get count of files that haven't been uploaded yet
 */
export const getPendingFilesCount = async (): Promise<number> => {
  try {
    const batch = await loadBatchState();
    if (!batch) return 0;
    
    return batch.files.filter(
      (f) => f.status !== 'completed'
    ).length;
  } catch (error) {
    return 0;
  }
};

