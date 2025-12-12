/**
 * Encrypted Storage Service
 * Handles file encryption/decryption using user's Clerk ID
 * Files are stored locally and encrypted so only the logged-in user can access them
 */

import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';

// Storage key for activity files metadata
const ACTIVITY_FILES_KEY = 'finofo_activity_files';

export interface SavedFile {
  id: string;
  name: string;
  type: string; // MIME type
  size: number;
  uploadedAt: string; // ISO date string
  encryptedUri: string; // Path to encrypted file
  thumbnailUri?: string; // Path to encrypted thumbnail (for images)
  uploadJobId?: string;
}

/**
 * Generate encryption key from user ID
 * Uses SHA-256 hash of the user ID as the key
 */
const generateKeyFromUserId = async (userId: string): Promise<string> => {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    userId + '_finofo_encryption_key'
  );
  return hash;
};

/**
 * Simple XOR encryption/decryption
 * Note: For production, consider using a more robust encryption library
 */
const xorEncryptDecrypt = (data: string, key: string): string => {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(
      data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
};

/**
 * Encrypt data using user's ID
 */
const encryptData = async (data: string, userId: string): Promise<string> => {
  const key = await generateKeyFromUserId(userId);
  const encrypted = xorEncryptDecrypt(data, key);
  // Convert to base64 for safe storage
  return btoa(encrypted);
};

/**
 * Decrypt data using user's ID
 */
const decryptData = async (encryptedData: string, userId: string): Promise<string> => {
  const key = await generateKeyFromUserId(userId);
  // Decode from base64
  const decoded = atob(encryptedData);
  return xorEncryptDecrypt(decoded, key);
};

/**
 * Get the directory for storing encrypted files
 */
const getEncryptedFilesDir = async (): Promise<string> => {
  const dir = `${FileSystem.documentDirectory}encrypted_files/`;
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
};

/**
 * Save file content encrypted to local storage
 */
export const saveEncryptedFile = async (
  fileUri: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  userId: string,
  uploadJobId?: string
): Promise<SavedFile> => {
  try {
    const dir = await getEncryptedFilesDir();
    const fileId = Crypto.randomUUID();
    const encryptedFileName = `${fileId}.enc`;
    const encryptedFilePath = `${dir}${encryptedFileName}`;

    // Read original file as base64
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Encrypt the content
    const encryptedContent = await encryptData(fileContent, userId);

    // Write encrypted content to new file
    await FileSystem.writeAsStringAsync(encryptedFilePath, encryptedContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const savedFile: SavedFile = {
      id: fileId,
      name: fileName,
      type: fileType,
      size: fileSize,
      uploadedAt: new Date().toISOString(),
      encryptedUri: encryptedFilePath,
      uploadJobId,
    };

    return savedFile;
  } catch (error) {
    console.error('Error saving encrypted file:', error);
    throw error;
  }
};

/**
 * Read and decrypt file content
 */
export const readEncryptedFile = async (
  encryptedUri: string,
  userId: string
): Promise<string> => {
  try {
    // Read encrypted content
    const encryptedContent = await FileSystem.readAsStringAsync(encryptedUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Decrypt the content
    const decryptedContent = await decryptData(encryptedContent, userId);

    return decryptedContent; // Returns base64 encoded file content
  } catch (error) {
    console.error('Error reading encrypted file:', error);
    throw error;
  }
};

/**
 * Get temporary decrypted file URI for viewing
 * Creates a temporary file that should be deleted after use
 */
export const getDecryptedFileUri = async (
  savedFile: SavedFile,
  userId: string
): Promise<string> => {
  try {
    const decryptedContent = await readEncryptedFile(savedFile.encryptedUri, userId);
    
    // Create temp file path
    const tempDir = `${FileSystem.cacheDirectory}temp_decrypted/`;
    const tempDirInfo = await FileSystem.getInfoAsync(tempDir);
    if (!tempDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
    }

    const extension = savedFile.name.split('.').pop() || 'file';
    const tempFilePath = `${tempDir}${savedFile.id}.${extension}`;

    // Write decrypted content to temp file
    await FileSystem.writeAsStringAsync(tempFilePath, decryptedContent, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return tempFilePath;
  } catch (error) {
    console.error('Error getting decrypted file URI:', error);
    throw error;
  }
};

/**
 * Delete encrypted file from storage
 */
export const deleteEncryptedFile = async (encryptedUri: string): Promise<void> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(encryptedUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(encryptedUri);
    }
  } catch (error) {
    console.error('Error deleting encrypted file:', error);
    throw error;
  }
};

/**
 * Clean up temp decrypted files
 */
export const cleanupTempFiles = async (): Promise<void> => {
  try {
    const tempDir = `${FileSystem.cacheDirectory}temp_decrypted/`;
    const dirInfo = await FileSystem.getInfoAsync(tempDir);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(tempDir, { idempotent: true });
    }
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
};

/**
 * Save activity files metadata (encrypted with user ID)
 */
export const saveActivityFilesMetadata = async (
  files: SavedFile[],
  userId: string
): Promise<void> => {
  try {
    const dir = await getEncryptedFilesDir();
    const metadataPath = `${dir}${ACTIVITY_FILES_KEY}_${await generateKeyFromUserId(userId).then(k => k.substring(0, 16))}.json`;
    
    const encryptedData = await encryptData(JSON.stringify(files), userId);
    await FileSystem.writeAsStringAsync(metadataPath, encryptedData, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (error) {
    console.error('Error saving activity files metadata:', error);
    throw error;
  }
};

/**
 * Load activity files metadata (decrypted with user ID)
 */
export const loadActivityFilesMetadata = async (
  userId: string
): Promise<SavedFile[]> => {
  try {
    const dir = await getEncryptedFilesDir();
    const metadataPath = `${dir}${ACTIVITY_FILES_KEY}_${await generateKeyFromUserId(userId).then(k => k.substring(0, 16))}.json`;
    
    const fileInfo = await FileSystem.getInfoAsync(metadataPath);
    if (!fileInfo.exists) {
      return [];
    }

    const encryptedData = await FileSystem.readAsStringAsync(metadataPath, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const decryptedData = await decryptData(encryptedData, userId);
    return JSON.parse(decryptedData) as SavedFile[];
  } catch (error) {
    console.error('Error loading activity files metadata:', error);
    return [];
  }
};

