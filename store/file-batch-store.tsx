/**
 * File Batch Store
 * Simple context to share file batch state across screens
 */

import { createContext, type ReactNode, useContext, useState } from 'react';
import type { DocumentFile } from '@/types/document';

interface FileBatchContextType {
  files: DocumentFile[];
  addFiles: (newFiles: DocumentFile[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setFiles: (files: DocumentFile[]) => void;
}

const FileBatchContext = createContext<FileBatchContextType | null>(null);

export function FileBatchProvider({ children }: { children: ReactNode }) {
  const [files, setFilesState] = useState<DocumentFile[]>([]);

  const addFiles = (newFiles: DocumentFile[]) => {
    setFilesState((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFilesState((prev) => prev.filter((f) => f.id !== id));
  };

  const clearFiles = () => {
    setFilesState([]);
  };

  const setFiles = (newFiles: DocumentFile[]) => {
    setFilesState(newFiles);
  };

  return (
    <FileBatchContext.Provider value={{ files, addFiles, removeFile, clearFiles, setFiles }}>
      {children}
    </FileBatchContext.Provider>
  );
}

export function useFileBatch() {
  const context = useContext(FileBatchContext);
  if (!context) {
    throw new Error('useFileBatch must be used within FileBatchProvider');
  }
  return context;
}
