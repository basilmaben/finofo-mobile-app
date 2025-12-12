/**
 * Services Export
 */

// Encryption services
export {
  decrypt,
  decryptFile,
  deriveKey,
  encrypt,
  encryptFile,
  generatePassphrase,
  generateSalt,
  hashPassphrase,
  verifyPassphrase,
  type EncryptedData,
} from './aesEncryption';

// Chunked upload service
export {
  cancelUpload,
  createUploadSession,
  deleteUploadSession,
  getUploadProgress,
  loadAllUploadSessions,
  loadUploadSession,
  resumeUpload,
  saveUploadSession,
  uploadFileChunked,
  type ChunkedUploadOptions,
  type ChunkedUploadProgress,
  type ChunkInfo,
  type UploadSession,
} from './chunkedUpload';

// Upload manager
export {
  getUploadManager,
  UploadManager,
  type BatchUploadProgress,
  type BatchUploadResult,
  type FileUploadItem,
} from './uploadManager';

// Encrypted storage (legacy)
export {
  cleanupTempFiles,
  deleteEncryptedFile,
  getDecryptedFileUri,
  loadActivityFilesMetadata,
  readEncryptedFile,
  saveActivityFilesMetadata,
  saveEncryptedFile,
  type SavedFile,
} from './encryptedStorage';

