/**
 * Chunked Upload Service
 * Handles resumable file uploads with progress tracking
 * Files are split into chunks and uploaded sequentially with state persistence
 */

import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { API_BASE_URL } from '@/config/env';

// Chunk size: 1MB (adjust based on network conditions)
const DEFAULT_CHUNK_SIZE = 1024 * 1024;

export interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  size: number;
  uploaded: boolean;
  checksum?: string;
}

export interface UploadSession {
  id: string;
  fileUri: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  totalChunks: number;
  chunkSize: number;
  chunks: ChunkInfo[];
  uploadedBytes: number;
  createdAt: string;
  lastUpdatedAt: string;
  signedUrl?: string;
  uploadJobId?: string;
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed';
  error?: string;
}

export interface ChunkedUploadProgress {
  sessionId: string;
  fileName: string;
  totalBytes: number;
  uploadedBytes: number;
  percentage: number;
  currentChunk: number;
  totalChunks: number;
  status: UploadSession['status'];
  bytesPerSecond?: number;
  estimatedTimeRemaining?: number; // in seconds
}

export interface ChunkedUploadOptions {
  chunkSize?: number;
  token?: string;
  onProgress?: (progress: ChunkedUploadProgress) => void;
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void;
  onError?: (error: Error, canResume: boolean) => void;
}

// Storage key for persisting upload sessions
const UPLOAD_SESSIONS_KEY = 'finofo_upload_sessions';

/**
 * Get the directory for storing upload session data
 */
const getUploadSessionsDir = async (): Promise<string> => {
  const dir = `${FileSystem.documentDirectory}upload_sessions/`;
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
};

/**
 * Save upload session to persistent storage
 */
export const saveUploadSession = async (session: UploadSession): Promise<void> => {
  try {
    const dir = await getUploadSessionsDir();
    const filePath = `${dir}${session.id}.json`;
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(session), {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (error) {
    console.error('Error saving upload session:', error);
    throw error;
  }
};

/**
 * Load upload session from persistent storage
 */
export const loadUploadSession = async (sessionId: string): Promise<UploadSession | null> => {
  try {
    const dir = await getUploadSessionsDir();
    const filePath = `${dir}${sessionId}.json`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    if (!fileInfo.exists) {
      return null;
    }
    
    const content = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    return JSON.parse(content) as UploadSession;
  } catch (error) {
    console.error('Error loading upload session:', error);
    return null;
  }
};

/**
 * Load all pending upload sessions
 */
export const loadAllUploadSessions = async (): Promise<UploadSession[]> => {
  try {
    const dir = await getUploadSessionsDir();
    const files = await FileSystem.readDirectoryAsync(dir);
    
    const sessions: UploadSession[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await FileSystem.readAsStringAsync(`${dir}${file}`, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const session = JSON.parse(content) as UploadSession;
        if (session.status !== 'completed') {
          sessions.push(session);
        }
      }
    }
    
    return sessions.sort((a, b) => 
      new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()
    );
  } catch (error) {
    console.error('Error loading upload sessions:', error);
    return [];
  }
};

/**
 * Delete upload session
 */
export const deleteUploadSession = async (sessionId: string): Promise<void> => {
  try {
    const dir = await getUploadSessionsDir();
    const filePath = `${dir}${sessionId}.json`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filePath);
    }
  } catch (error) {
    console.error('Error deleting upload session:', error);
  }
};

/**
 * Calculate file checksum for integrity verification
 */
const calculateChecksum = async (data: string): Promise<string> => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data
  );
};

/**
 * Create a new upload session for a file
 */
export const createUploadSession = async (
  fileUri: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  chunkSize: number = DEFAULT_CHUNK_SIZE
): Promise<UploadSession> => {
  const totalChunks = Math.ceil(fileSize / chunkSize);
  const chunks: ChunkInfo[] = [];
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, fileSize);
    chunks.push({
      index: i,
      start,
      end,
      size: end - start,
      uploaded: false,
    });
  }
  
  const session: UploadSession = {
    id: Crypto.randomUUID(),
    fileUri,
    fileName,
    fileType,
    fileSize,
    totalChunks,
    chunkSize,
    chunks,
    uploadedBytes: 0,
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    status: 'pending',
  };
  
  await saveUploadSession(session);
  return session;
};

/**
 * Read a specific chunk from a file
 */
const readFileChunk = async (
  fileUri: string,
  start: number,
  length: number
): Promise<string> => {
  // Read the entire file as base64 and extract the chunk
  // Note: For very large files, consider using a streaming approach
  const fullContent = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  
  // Base64 encoding increases size by ~33%, so we need to adjust offsets
  const base64Start = Math.floor((start / 3) * 4);
  const base64Length = Math.ceil((length / 3) * 4);
  
  return fullContent.substring(base64Start, base64Start + base64Length);
};

/**
 * Upload a single chunk with retry logic
 */
const uploadChunk = async (
  session: UploadSession,
  chunk: ChunkInfo,
  chunkData: string,
  token?: string,
  retries: number = 3
): Promise<boolean> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // If we have a signed URL, upload directly to S3
      if (session.signedUrl) {
        const response = await fetch(session.signedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': session.fileType,
            'Content-Range': `bytes ${chunk.start}-${chunk.end - 1}/${session.fileSize}`,
            'x-amz-checksum-sha256': await calculateChecksum(chunkData),
          },
          body: chunkData,
        });
        
        if (response.ok || response.status === 308) {
          return true;
        }
      } else {
        // Upload chunk to our backend which will handle S3 multipart
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/document/upload/chunk`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session_id: session.id,
            chunk_index: chunk.index,
            chunk_data: chunkData,
            chunk_checksum: await calculateChecksum(chunkData),
            total_chunks: session.totalChunks,
            file_name: session.fileName,
            file_type: session.fileType,
            file_size: session.fileSize,
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          // Store upload job ID and signed URL if returned
          if (result.upload_job_id) {
            session.uploadJobId = result.upload_job_id;
          }
          if (result.signed_url) {
            session.signedUrl = result.signed_url;
          }
          return true;
        }
      }
      
      // Wait before retry with exponential backoff
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    } catch (error) {
      console.error(`Chunk ${chunk.index} upload attempt ${attempt + 1} failed:`, error);
      if (attempt === retries - 1) {
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  return false;
};

/**
 * Upload a file using chunked upload with resumability
 */
export const uploadFileChunked = async (
  fileUri: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  options: ChunkedUploadOptions = {}
): Promise<{ success: boolean; uploadJobId?: string; error?: string }> => {
  const { 
    chunkSize = DEFAULT_CHUNK_SIZE, 
    token, 
    onProgress, 
    onChunkComplete,
    onError,
  } = options;
  
  // Create or resume session
  let session = await createUploadSession(fileUri, fileName, fileType, fileSize, chunkSize);
  
  const startTime = Date.now();
  let lastProgressTime = startTime;
  let lastUploadedBytes = 0;
  
  const reportProgress = (uploadedBytes: number, currentChunk: number) => {
    const now = Date.now();
    const timeDiff = (now - lastProgressTime) / 1000; // in seconds
    const bytesDiff = uploadedBytes - lastUploadedBytes;
    const bytesPerSecond = timeDiff > 0 ? bytesDiff / timeDiff : 0;
    
    const remainingBytes = session.fileSize - uploadedBytes;
    const estimatedTimeRemaining = bytesPerSecond > 0 
      ? remainingBytes / bytesPerSecond 
      : undefined;
    
    onProgress?.({
      sessionId: session.id,
      fileName: session.fileName,
      totalBytes: session.fileSize,
      uploadedBytes,
      percentage: Math.round((uploadedBytes / session.fileSize) * 100),
      currentChunk,
      totalChunks: session.totalChunks,
      status: session.status,
      bytesPerSecond: Math.round(bytesPerSecond),
      estimatedTimeRemaining: estimatedTimeRemaining 
        ? Math.round(estimatedTimeRemaining) 
        : undefined,
    });
    
    lastProgressTime = now;
    lastUploadedBytes = uploadedBytes;
  };
  
  try {
    session.status = 'uploading';
    await saveUploadSession(session);
    
    // Upload chunks sequentially
    for (const chunk of session.chunks) {
      // Skip already uploaded chunks (for resume)
      if (chunk.uploaded) {
        continue;
      }
      
      // Read chunk data
      const chunkData = await readFileChunk(fileUri, chunk.start, chunk.size);
      
      // Upload chunk
      const success = await uploadChunk(session, chunk, chunkData, token);
      
      if (success) {
        chunk.uploaded = true;
        session.uploadedBytes += chunk.size;
        session.lastUpdatedAt = new Date().toISOString();
        await saveUploadSession(session);
        
        reportProgress(session.uploadedBytes, chunk.index + 1);
        onChunkComplete?.(chunk.index, session.totalChunks);
      } else {
        throw new Error(`Failed to upload chunk ${chunk.index}`);
      }
    }
    
    // Complete the upload
    session.status = 'completed';
    await saveUploadSession(session);
    
    // Clean up session after successful upload
    await deleteUploadSession(session.id);
    
    return {
      success: true,
      uploadJobId: session.uploadJobId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    
    // Check if we can resume (network error vs server error)
    const canResume = session.uploadedBytes > 0;
    
    session.status = canResume ? 'paused' : 'failed';
    session.error = errorMessage;
    session.lastUpdatedAt = new Date().toISOString();
    await saveUploadSession(session);
    
    onError?.(error instanceof Error ? error : new Error(errorMessage), canResume);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Resume a paused upload session
 */
export const resumeUpload = async (
  sessionId: string,
  options: ChunkedUploadOptions = {}
): Promise<{ success: boolean; uploadJobId?: string; error?: string }> => {
  const session = await loadUploadSession(sessionId);
  
  if (!session) {
    return {
      success: false,
      error: 'Upload session not found',
    };
  }
  
  // Verify the source file still exists
  const fileInfo = await FileSystem.getInfoAsync(session.fileUri);
  if (!fileInfo.exists) {
    await deleteUploadSession(sessionId);
    return {
      success: false,
      error: 'Source file no longer exists',
    };
  }
  
  // Resume from where we left off
  return uploadFileChunked(
    session.fileUri,
    session.fileName,
    session.fileType,
    session.fileSize,
    {
      ...options,
      chunkSize: session.chunkSize,
    }
  );
};

/**
 * Cancel an upload session
 */
export const cancelUpload = async (sessionId: string): Promise<void> => {
  const session = await loadUploadSession(sessionId);
  if (session) {
    session.status = 'failed';
    session.error = 'Cancelled by user';
    await saveUploadSession(session);
    await deleteUploadSession(sessionId);
  }
};

/**
 * Get upload progress for a session
 */
export const getUploadProgress = async (
  sessionId: string
): Promise<ChunkedUploadProgress | null> => {
  const session = await loadUploadSession(sessionId);
  
  if (!session) {
    return null;
  }
  
  const uploadedChunks = session.chunks.filter(c => c.uploaded).length;
  
  return {
    sessionId: session.id,
    fileName: session.fileName,
    totalBytes: session.fileSize,
    uploadedBytes: session.uploadedBytes,
    percentage: Math.round((session.uploadedBytes / session.fileSize) * 100),
    currentChunk: uploadedChunks,
    totalChunks: session.totalChunks,
    status: session.status,
  };
};

