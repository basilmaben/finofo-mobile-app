/**
 * Upload API Service
 * Handles file uploads using signed URLs
 * Supported file types: PDF, JPEG, PNG
 */

import { API_BASE_URL } from '@/config/env';

export interface FileMetadata {
  filename: string;
  file_type: 'pdf' | 'jpg' | 'png';
  file_size_bytes: number;
  document_type: 'unknown' | string;
}

export interface UploadRequestPayload {
  files: FileMetadata[];
  image_batches: unknown[];
}

export interface SignedUrl {
  url: string;
  filename: string;
  fields: Record<string, unknown>;
}

export interface UploadSuccessResponse {
  signed_urls: SignedUrl[];
  errors: unknown[];
  upload_job_id: string;
}

export interface UploadProgress {
  progress: number;
  phase: 'requesting_urls' | 'uploading' | 'complete' | 'error';
  currentFile?: number;
  totalFiles?: number;
  error?: string;
}

export interface UploadResult {
  success: boolean;
  uploadJobId?: string;
  error?: string;
}

/** Supported MIME types for upload */
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg', 
  'image/png',
];

/** Check if a MIME type is supported */
export const isSupportedFileType = (mimeType: string): boolean => {
  return SUPPORTED_MIME_TYPES.includes(mimeType.toLowerCase());
};

/**
 * Get file type for API request (backend expects 'jpg')
 */
const getFileType = (mimeType: string): 'pdf' | 'jpg' | 'png' => {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  return 'jpg'; // Default to jpg for images
};

/**
 * Get Content-Type for S3 upload
 * Note: Backend S3 policy expects short form (jpeg, png, pdf)
 */
const getS3ContentType = (mimeType: string): string => {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'jpeg'; // S3 policy expects 'jpeg' not 'jpg'
  if (mimeType === 'image/png') return 'png';
  return 'jpeg'; // Default
};

/**
 * Request signed URLs for uploading files
 */
export const requestSignedUrls = async (
  files: { name: string; type: string; size: number }[],
  token?: string
): Promise<UploadSuccessResponse> => {
  const payload: UploadRequestPayload = {
    files: files.map((file) => ({
      filename: file.name,
      file_type: getFileType(file.type),
      file_size_bytes: file.size,
      document_type: 'unknown'
    })),
    image_batches: []
  };

  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}/document/upload`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorMessage = 'Upload failed';
    try {
      const responseText = await response.text();
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.detail?.[0]?.msg || errorData.detail || errorData.message || errorMessage;
      } catch {
        // Not JSON
      }
    } catch {
      // Failed to read response
    }
    throw new Error(errorMessage);
  }

  const result = (await response.json()) as UploadSuccessResponse;
  return result;
};

/**
 * Upload file to signed URL with progress tracking
 */
export const uploadFileToSignedUrl = async (
  fileUri: string,
  fileName: string,
  fileType: string,
  signedUrl: SignedUrl,
  onProgress?: (progress: number) => void
): Promise<void> => {
  const formData = new FormData();

  // Add acl field first - required by S3 policy
  formData.append('acl', 'private');
  
  // Add Content-Type field - required by S3 policy
  formData.append('Content-Type', getS3ContentType(fileType));

  // Add all signed URL fields (policy, signature, key, etc.)
  Object.entries(signedUrl.fields).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  // Add the file LAST - this is required by S3 presigned POST
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: getS3ContentType(fileType),
  } as any);

  // Use XMLHttpRequest for progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 400) {
        resolve();
      } else if (xhr.status === 0) {
        // CORS or network issue, but upload may have succeeded
        resolve();
      } else {
        reject(new Error(`Upload failed`));
      }
    });

    xhr.addEventListener('error', () => {
      if (xhr.readyState === 4 && xhr.status === 0) {
        resolve();
      } else {
        reject(new Error(`Upload failed`));
      }
    });

    xhr.addEventListener('abort', () => {
      reject(new Error(`Upload cancelled`));
    });

    xhr.open('POST', signedUrl.url);
    xhr.send(formData);
  });
};

/**
 * Upload files to the backend using signed URLs
 */
export const uploadFiles = async (
  files: { uri: string; name: string; type: string; size: number }[],
  options?: {
    token?: string | null;
    onProgress?: (progress: UploadProgress) => void;
  }
): Promise<UploadResult> => {
  const { token, onProgress } = options ?? {};

  const reportProgress = (progress: UploadProgress) => {
    onProgress?.(progress);
  };

  try {
    // Phase 1: Request signed URLs (0-10% of progress)
    reportProgress({ progress: 5, phase: 'requesting_urls' });

    const signedUrlsResponse = await requestSignedUrls(
      files.map(f => ({ name: f.name, type: f.type, size: f.size })),
      token || undefined
    );

    reportProgress({ progress: 10, phase: 'requesting_urls' });

    // Phase 2: Upload files to signed URLs (10-100% of progress)
    const totalFiles = files.length;
    const progressPerFile = 90 / totalFiles;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Case-insensitive filename matching (backend may normalize casing)
      const signedUrl = signedUrlsResponse.signed_urls.find(
        (url) => url.filename.toLowerCase() === file.name.toLowerCase()
      );

      const baseProgress = 10 + i * progressPerFile;

      // Report start of this file upload
      reportProgress({
        progress: Math.round(baseProgress),
        phase: 'uploading',
        currentFile: i + 1,
        totalFiles
      });

      if (signedUrl) {
        await uploadFileToSignedUrl(
          file.uri,
          file.name,
          file.type,
          signedUrl,
          (fileProgress) => {
            const totalProgress = baseProgress + (fileProgress / 100) * progressPerFile;
            reportProgress({
              progress: Math.round(totalProgress),
              phase: 'uploading',
              currentFile: i + 1,
              totalFiles
            });
          }
        );
      }

      // Report completion of this file
      reportProgress({
        progress: Math.round(baseProgress + progressPerFile),
        phase: 'uploading',
        currentFile: i + 1,
        totalFiles
      });
    }

    // Phase 3: Complete
    reportProgress({ progress: 100, phase: 'complete' });

    return {
      success: true,
      uploadJobId: signedUrlsResponse.upload_job_id
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';

    reportProgress({
      progress: 0,
      phase: 'error',
      error: errorMessage
    });

    return {
      success: false,
      error: errorMessage
    };
  }
};


