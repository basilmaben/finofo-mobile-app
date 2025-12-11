/**
 * Document types for Document Capture & Upload
 */

// Document types supported for upload
export type DocumentType = 'packing_slip' | 'invoice' | 'invoice_packing_slip';

// File captured or selected for upload
export interface DocumentFile {
  id: string;
  uri: string;
  name: string;
  type: string; // MIME type (image/jpeg, application/pdf, etc.)
  size: number;
  createdAt: Date;
}

// Labels for document types
export const DocumentTypeLabels: Record<DocumentType, string> = {
  packing_slip: 'Packing Slip',
  invoice: 'Invoice',
  invoice_packing_slip: 'Invoice & Packing Slip',
};

// Colors for document types (used in UI)
export const DocumentTypeColors: Record<DocumentType, string> = {
  packing_slip: '#00D9A5',
  invoice: '#FF6B5B',
  invoice_packing_slip: '#A78BFA',
};
