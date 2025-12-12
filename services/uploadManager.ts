/**
 * Upload Manager Service
 * Manages file uploads with chunked upload support, progress tracking,
 * and network resilience with automatic resume capability
 */

import { API_BASE_URL } from '@/config/env';
import { requestSignedUrls, uploadFileToSignedUrl } from '@/api/upload';

// NetInfo types (optional dependency)
interface NetInfoState {
  isConnected: boolean | null;
}

// Try to import NetInfo, but don't fail if not available
let NetInfo: {
  addEventListener?: (callback: (state: NetInfoState) => void) => () => void;
} | null = null;

try {
  // Dynamic import for optional dependency
  NetInfo = require('@react-native-community/netinfo').default;
} catch {
  // NetInfo not available, network monitoring will be disabled
  console.log('NetInfo not installed, network monitoring disabled');
}
import {
  cancelUpload as cancelChunkedUpload,
  type ChunkedUploadProgress,
  createUploadSession,
  deleteUploadSession,
  loadAllUploadSessions,
  loadUploadSession,
  resumeUpload,
  saveUploadSession,
  uploadFileChunked,
  type UploadSession,
} from './chunkedUpload';

// Threshold for using chunked uploads (5MB)
const CHUNKED_UPLOAD_THRESHOLD = 5 * 1024 * 1024;

export interface FileUploadItem {
  id: string;
  uri: string;
  name: string;
  type: string;
  size: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'paused';
  progress: number;
  error?: string;
  sessionId?: string;
  uploadJobId?: string;
}

export interface BatchUploadProgress {
  totalFiles: number;
  completedFiles: number;
  currentFileIndex: number;
  currentFile?: FileUploadItem;
  totalBytes: number;
  uploadedBytes: number;
  overallProgress: number;
  status: 'idle' | 'uploading' | 'paused' | 'completed' | 'failed';
  isNetworkAvailable: boolean;
  canResume: boolean;
}

export interface BatchUploadResult {
  success: boolean;
  completedFiles: FileUploadItem[];
  failedFiles: FileUploadItem[];
  uploadJobId?: string;
}

type ProgressCallback = (progress: BatchUploadProgress) => void;
type FileProgressCallback = (file: FileUploadItem) => void;

export class UploadManager {
  private files: Map<string, FileUploadItem> = new Map();
  private token: string | null = null;
  private progressCallbacks: Set<ProgressCallback> = new Set();
  private fileProgressCallbacks: Set<FileProgressCallback> = new Set();
  private isUploading = false;
  private isPaused = false;
  private isNetworkAvailable = true;
  private networkUnsubscribe: (() => void) | null = null;
  private currentSessionId: string | null = null;

  constructor() {
    this.setupNetworkListener();
  }

  /**
   * Set up network state listener for automatic pause/resume
   */
  private setupNetworkListener(): void {
    // NetInfo subscription for network changes
    // Optional: Install @react-native-community/netinfo for network monitoring
    if (NetInfo?.addEventListener) {
      try {
        this.networkUnsubscribe = NetInfo.addEventListener(
          (state: NetInfoState) => {
            const wasAvailable = this.isNetworkAvailable;
            this.isNetworkAvailable = state.isConnected ?? false;

            // Auto-resume if network becomes available and we have paused uploads
            if (!wasAvailable && this.isNetworkAvailable && this.isPaused) {
              this.resume();
            }

            // Auto-pause if network becomes unavailable during upload
            if (wasAvailable && !this.isNetworkAvailable && this.isUploading) {
              this.pause();
            }
          }
        );
      } catch (error) {
        console.log('Failed to set up network listener:', error);
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
    }
    this.progressCallbacks.clear();
    this.fileProgressCallbacks.clear();
  }

  /**
   * Set authentication token for uploads
   */
  setToken(token: string | null): void {
    this.token = token;
  }

  /**
   * Subscribe to overall progress updates
   */
  onProgress(callback: ProgressCallback): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  /**
   * Subscribe to individual file progress updates
   */
  onFileProgress(callback: FileProgressCallback): () => void {
    this.fileProgressCallbacks.add(callback);
    return () => this.fileProgressCallbacks.delete(callback);
  }

  /**
   * Notify all progress subscribers
   */
  private notifyProgress(): void {
    const progress = this.getProgress();
    this.progressCallbacks.forEach((cb) => cb(progress));
  }

  /**
   * Notify all file progress subscribers
   */
  private notifyFileProgress(file: FileUploadItem): void {
    this.fileProgressCallbacks.forEach((cb) => cb(file));
  }

  /**
   * Add files to the upload queue
   */
  addFiles(
    files: Array<{ uri: string; name: string; type: string; size: number }>
  ): FileUploadItem[] {
    const items: FileUploadItem[] = [];

    for (const file of files) {
      const id = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const item: FileUploadItem = {
        id,
        uri: file.uri,
        name: file.name,
        type: file.type,
        size: file.size,
        status: 'pending',
        progress: 0,
      };
      this.files.set(id, item);
      items.push(item);
    }

    this.notifyProgress();
    return items;
  }

  /**
   * Remove a file from the queue
   */
  removeFile(id: string): void {
    const file = this.files.get(id);
    if (file?.sessionId) {
      deleteUploadSession(file.sessionId);
    }
    this.files.delete(id);
    this.notifyProgress();
  }

  /**
   * Clear all files from the queue
   */
  clear(): void {
    this.files.forEach((file) => {
      if (file.sessionId) {
        deleteUploadSession(file.sessionId);
      }
    });
    this.files.clear();
    this.isUploading = false;
    this.isPaused = false;
    this.notifyProgress();
  }

  /**
   * Get all files in the queue
   */
  getFiles(): FileUploadItem[] {
    return Array.from(this.files.values());
  }

  /**
   * Get current upload progress
   */
  getProgress(): BatchUploadProgress {
    const files = this.getFiles();
    const totalFiles = files.length;
    const completedFiles = files.filter((f) => f.status === 'completed').length;
    const currentFile = files.find((f) => f.status === 'uploading');
    const currentFileIndex = currentFile
      ? files.indexOf(currentFile)
      : completedFiles;

    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    const uploadedBytes = files.reduce((sum, f) => {
      if (f.status === 'completed') return sum + f.size;
      if (f.status === 'uploading') return sum + (f.size * f.progress) / 100;
      return sum;
    }, 0);

    const overallProgress =
      totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0;

    let status: BatchUploadProgress['status'] = 'idle';
    if (this.isUploading) {
      status = this.isPaused ? 'paused' : 'uploading';
    } else if (completedFiles === totalFiles && totalFiles > 0) {
      status = 'completed';
    } else if (files.some((f) => f.status === 'failed')) {
      status = 'failed';
    }

    const canResume = files.some(
      (f) => f.status === 'paused' || f.status === 'failed'
    );

    return {
      totalFiles,
      completedFiles,
      currentFileIndex,
      currentFile,
      totalBytes,
      uploadedBytes,
      overallProgress,
      status,
      isNetworkAvailable: this.isNetworkAvailable,
      canResume,
    };
  }

  /**
   * Start uploading all pending files
   */
  async start(): Promise<BatchUploadResult> {
    if (this.isUploading && !this.isPaused) {
      throw new Error('Upload already in progress');
    }

    this.isUploading = true;
    this.isPaused = false;
    this.notifyProgress();

    const completedFiles: FileUploadItem[] = [];
    const failedFiles: FileUploadItem[] = [];
    let uploadJobId: string | undefined;

    const files = this.getFiles().filter(
      (f) => f.status === 'pending' || f.status === 'paused' || f.status === 'failed'
    );

    for (const file of files) {
      // Check if paused
      if (this.isPaused) {
        file.status = 'paused';
        this.files.set(file.id, file);
        break;
      }

      // Check network availability
      if (!this.isNetworkAvailable) {
        file.status = 'paused';
        this.files.set(file.id, file);
        this.isPaused = true;
        break;
      }

      // Update file status
      file.status = 'uploading';
      file.progress = 0;
      this.files.set(file.id, file);
      this.notifyProgress();
      this.notifyFileProgress(file);

      try {
        // Use chunked upload for large files, regular upload for small files
        if (file.size >= CHUNKED_UPLOAD_THRESHOLD) {
          const result = await this.uploadFileChunked(file);
          if (result.success) {
            file.status = 'completed';
            file.progress = 100;
            file.uploadJobId = result.uploadJobId;
            uploadJobId = result.uploadJobId;
            completedFiles.push(file);
          } else {
            file.status = 'failed';
            file.error = result.error;
            failedFiles.push(file);
          }
        } else {
          const result = await this.uploadFileSimple(file);
          if (result.success) {
            file.status = 'completed';
            file.progress = 100;
            file.uploadJobId = result.uploadJobId;
            uploadJobId = result.uploadJobId;
            completedFiles.push(file);
          } else {
            file.status = 'failed';
            file.error = result.error;
            failedFiles.push(file);
          }
        }
      } catch (error) {
        file.status = 'failed';
        file.error =
          error instanceof Error ? error.message : 'Upload failed';
        failedFiles.push(file);
      }

      this.files.set(file.id, file);
      this.notifyProgress();
      this.notifyFileProgress(file);
    }

    this.isUploading = false;
    this.notifyProgress();

    return {
      success: failedFiles.length === 0,
      completedFiles,
      failedFiles,
      uploadJobId,
    };
  }

  /**
   * Upload a file using chunked upload (for large files)
   */
  private async uploadFileChunked(
    file: FileUploadItem
  ): Promise<{ success: boolean; uploadJobId?: string; error?: string }> {
    return uploadFileChunked(file.uri, file.name, file.type, file.size, {
      token: this.token ?? undefined,
      onProgress: (progress: ChunkedUploadProgress) => {
        file.progress = progress.percentage;
        file.sessionId = progress.sessionId;
        this.files.set(file.id, file);
        this.notifyProgress();
        this.notifyFileProgress(file);
      },
      onError: (error, canResume) => {
        if (canResume) {
          file.status = 'paused';
        } else {
          file.status = 'failed';
          file.error = error.message;
        }
        this.files.set(file.id, file);
        this.notifyProgress();
        this.notifyFileProgress(file);
      },
    });
  }

  /**
   * Upload a file using signed URL flow (original working method)
   */
  private async uploadFileSimple(
    file: FileUploadItem
  ): Promise<{ success: boolean; uploadJobId?: string; error?: string }> {
    try {
      // Step 1: Request signed URL from backend
      const signedUrlResponse = await requestSignedUrls(
        [{ name: file.name, type: file.type, size: file.size }],
        this.token ?? undefined
      );

      const signedUrl = signedUrlResponse.signed_urls[0];
      if (!signedUrl) {
        return { success: false, error: 'Failed to get upload URL' };
      }

      // Step 2: Upload file to S3 using signed URL
      await uploadFileToSignedUrl(
        file.uri,
        file.name,
        file.type,
        signedUrl,
        (progress) => {
          file.progress = Math.round(progress);
          this.files.set(file.id, file);
          this.notifyProgress();
          this.notifyFileProgress(file);
        }
      );

      return {
        success: true,
        uploadJobId: signedUrlResponse.upload_job_id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Pause the current upload
   */
  pause(): void {
    if (!this.isUploading) return;

    this.isPaused = true;
    const currentFile = this.getFiles().find((f) => f.status === 'uploading');
    if (currentFile) {
      currentFile.status = 'paused';
      this.files.set(currentFile.id, currentFile);
    }
    this.notifyProgress();
  }

  /**
   * Resume paused uploads
   */
  async resume(): Promise<BatchUploadResult> {
    if (!this.isPaused && this.isUploading) {
      throw new Error('Upload is not paused');
    }

    this.isPaused = false;
    return this.start();
  }

  /**
   * Cancel all uploads
   */
  cancel(): void {
    // Cancel any chunked upload sessions
    this.files.forEach((file) => {
      if (file.sessionId) {
        cancelChunkedUpload(file.sessionId);
      }
    });

    // Clear all files - don't set to failed, just clear
    this.files.clear();
    this.isUploading = false;
    this.isPaused = false;
    
    // Notify with idle state (empty files = idle)
    this.notifyProgress();
  }

  /**
   * Retry failed uploads
   */
  async retry(): Promise<BatchUploadResult> {
    const failedFiles = this.getFiles().filter((f) => f.status === 'failed');
    for (const file of failedFiles) {
      file.status = 'pending';
      file.progress = 0;
      file.error = undefined;
      this.files.set(file.id, file);
    }
    this.notifyProgress();

    return this.start();
  }

  /**
   * Load any persisted upload sessions for resume
   */
  async loadPersistedSessions(): Promise<UploadSession[]> {
    return loadAllUploadSessions();
  }
}

// Singleton instance
let uploadManagerInstance: UploadManager | null = null;

export const getUploadManager = (): UploadManager => {
  if (!uploadManagerInstance) {
    uploadManagerInstance = new UploadManager();
  }
  return uploadManagerInstance;
};

