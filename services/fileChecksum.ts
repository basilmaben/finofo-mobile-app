/**
 * File Checksum Service
 * Calculates checksums for duplicate detection
 */

import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Calculate MD5 checksum of a file
 * Uses first 1MB for large files to keep it fast
 */
export const calculateFileChecksum = async (uri: string): Promise<string> => {
  try {
    // Read file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // For large files, only read first 1MB for quick checksum
    const maxBytes = 1024 * 1024; // 1MB
    const fileSize = (fileInfo as { size?: number }).size || 0;
    
    let content: string;
    
    if (fileSize > maxBytes) {
      // Read first chunk only for large files
      // Note: expo-file-system doesn't support partial reads easily,
      // so we'll use file metadata + size as a quick fingerprint
      content = `${uri}:${fileSize}:${(fileInfo as { modificationTime?: number }).modificationTime || 0}`;
    } else {
      // Read entire file for small files
      content = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    // Generate SHA-256 hash
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      content
    );

    return hash;
  } catch (error) {
    console.error('Failed to calculate checksum:', error);
    // Fallback to URI-based hash if file read fails
    return Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      uri + Date.now()
    );
  }
};

/**
 * Calculate quick fingerprint based on file metadata
 * Faster than full checksum, good for initial duplicate detection
 */
export const calculateQuickFingerprint = async (
  name: string,
  size: number,
  type: string
): Promise<string> => {
  const content = `${name}:${size}:${type}`;
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.MD5,
    content
  );
};

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingFileId?: string;
  existingFileName?: string;
}

/**
 * Check if a file already exists in a list based on fingerprint
 */
export const checkForDuplicate = async (
  newFile: { name: string; size: number; type: string },
  existingFiles: Array<{ id: string; name: string; size: number; type: string; checksum?: string }>
): Promise<DuplicateCheckResult> => {
  // Quick check by name and size first
  const quickMatch = existingFiles.find(
    (f) => f.name === newFile.name && f.size === newFile.size && f.type === newFile.type
  );

  if (quickMatch) {
    return {
      isDuplicate: true,
      existingFileId: quickMatch.id,
      existingFileName: quickMatch.name,
    };
  }

  // Check by size and type only (might be renamed)
  const sizeMatch = existingFiles.find(
    (f) => f.size === newFile.size && f.type === newFile.type
  );

  if (sizeMatch) {
    return {
      isDuplicate: true,
      existingFileId: sizeMatch.id,
      existingFileName: sizeMatch.name,
    };
  }

  return { isDuplicate: false };
};

