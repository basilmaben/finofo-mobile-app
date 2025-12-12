/**
 * Upload Sheet Context
 * Allows any component to trigger the upload bottom sheet
 */

import { createContext, type ReactNode, useCallback, useContext, useRef } from 'react';
import type BottomSheet from '@gorhom/bottom-sheet';

interface UploadSheetContextType {
  openUploadSheet: () => void;
  registerSheetRef: (ref: BottomSheet | null) => void;
}

const UploadSheetContext = createContext<UploadSheetContextType | null>(null);

export function UploadSheetProvider({ children }: { children: ReactNode }) {
  const sheetRef = useRef<BottomSheet | null>(null);

  const registerSheetRef = useCallback((ref: BottomSheet | null) => {
    sheetRef.current = ref;
  }, []);

  const openUploadSheet = useCallback(() => {
    sheetRef.current?.expand();
  }, []);

  return (
    <UploadSheetContext.Provider value={{ openUploadSheet, registerSheetRef }}>
      {children}
    </UploadSheetContext.Provider>
  );
}

export function useUploadSheet() {
  const context = useContext(UploadSheetContext);
  if (!context) {
    throw new Error('useUploadSheet must be used within an UploadSheetProvider');
  }
  return context;
}

