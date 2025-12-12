/**
 * Document types for Document Capture & Upload
 */

// File captured or selected for upload
export interface DocumentFile {
  id: string;
  uri: string;
  name: string;
  type: string; // MIME type (image/jpeg, application/pdf, etc.)
  size: number;
  createdAt: Date;
}
