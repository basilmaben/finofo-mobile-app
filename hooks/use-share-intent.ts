/**
 * Hook to handle files shared from other apps
 * Uses expo-share-intent to receive shared images and PDFs
 */

import { router, usePathname } from 'expo-router';
import { useShareIntent } from 'expo-share-intent';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useFileBatch } from '@/store/file-batch-store';
import type { DocumentFile } from '@/types/document';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function useHandleShareIntent() {
  const { shareIntent, resetShareIntent } = useShareIntent();
  const { addFiles, files } = useFileBatch();
  const pathname = usePathname();
  const processedRef = useRef(false);

  useEffect(() => {
    // Reset processed flag when shareIntent changes
    if (!shareIntent) {
      processedRef.current = false;
      return;
    }

    // Prevent double processing
    if (processedRef.current) return;
    processedRef.current = true;

    const processSharedContent = async () => {
      const newFiles: DocumentFile[] = [];

      // Handle shared files (images, PDFs)
      if (shareIntent.files && shareIntent.files.length > 0) {
        for (const file of shareIntent.files) {
          // Check if it's an image or PDF
          const isImage = file.mimeType?.startsWith('image/');
          const isPdf = file.mimeType === 'application/pdf';

          if (isImage || isPdf) {
            // Use path or uri, whichever is available
            const fileUri = file.path || (file as any).uri || '';

            if (fileUri) {
              newFiles.push({
                id: generateId(),
                uri: fileUri,
                name: file.fileName || `Shared_${Date.now()}${isPdf ? '.pdf' : '.jpg'}`,
                type: file.mimeType || (isPdf ? 'application/pdf' : 'image/jpeg'),
                size: file.size || 0,
                createdAt: new Date(),
              });
            }
          }
        }
      }

      // If we have files to add
      if (newFiles.length > 0) {
        // Add files to the existing batch (appends to current files)
        addFiles(newFiles);

        const totalFiles = files.length + newFiles.length;
        const message =
          files.length > 0
            ? `Added ${newFiles.length} file(s) to your batch (${totalFiles} total)`
            : `${newFiles.length} file(s) ready to upload`;

        // Show feedback
        Alert.alert('Files Added', message, [
          {
            text: 'Review & Upload',
            onPress: () => {
              // Navigate to upload preview
              if (pathname !== '/upload-preview') {
                router.push('/upload-preview');
              }
            },
          },
          {
            text: 'Add More',
            style: 'cancel',
            onPress: () => {
              // Stay on main screen to add more
              if (pathname !== '/(tabs)' && pathname !== '/') {
                router.replace('/(tabs)');
              }
            },
          },
        ]);
      }

      // Reset the share intent after processing
      resetShareIntent();
    };

    // Small delay to ensure the app is fully mounted
    setTimeout(processSharedContent, 300);
  }, [shareIntent, addFiles, files.length, pathname, resetShareIntent]);

  return {
    hasSharedContent: !!shareIntent,
    sharedFilesCount: shareIntent?.files?.length || 0,
  };
}
