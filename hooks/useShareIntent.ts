/**
 * Hook to handle files shared from other apps
 * Uses expo-share-intent to receive shared images and PDFs
 */

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useShareIntent } from 'expo-share-intent';
import { useEffect, useRef } from 'react';
import { useFileBatch } from '@/store/file-batch-store';
import type { DocumentFile } from '@/types/document';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function useHandleShareIntent() {
  const { shareIntent, resetShareIntent, hasShareIntent } = useShareIntent();
  const { addFiles } = useFileBatch();
  const processedIntentRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasShareIntent || !shareIntent) {
      return;
    }

    // Create a unique key for this intent to prevent double processing
    const intentKey = JSON.stringify(shareIntent);
    if (processedIntentRef.current === intentKey) {
      return;
    }
    processedIntentRef.current = intentKey;

    const processSharedContent = async () => {
      const newFiles: DocumentFile[] = [];

      // Handle shared files (images, PDFs)
      if (shareIntent.files && shareIntent.files.length > 0) {
        for (const file of shareIntent.files) {
          const fileAny = file as any;
          const mimeType = file.mimeType || fileAny.type || '';
          const isImage = mimeType.startsWith('image/');
          const isPdf = mimeType === 'application/pdf';

          if (isImage || isPdf || !mimeType) {
            const fileUri = file.path || fileAny.uri || fileAny.contentUri || '';

            if (fileUri) {
              newFiles.push({
                id: generateId(),
                uri: fileUri,
                name:
                  file.fileName || fileAny.name || `Shared_${Date.now()}${isPdf ? '.pdf' : '.jpg'}`,
                type: mimeType || (isPdf ? 'application/pdf' : 'image/jpeg'),
                size: file.size || fileAny.fileSize || 0,
                createdAt: new Date(),
              });
            }
          }
        }
      }

      // Also check for single image/media share (some apps share differently)
      if (newFiles.length === 0 && shareIntent.type === 'media') {
        const mediaUri = (shareIntent as any).mediaUri || (shareIntent as any).uri;
        if (mediaUri) {
          newFiles.push({
            id: generateId(),
            uri: mediaUri,
            name: `Shared_${Date.now()}.jpg`,
            type: 'image/jpeg',
            size: 0,
            createdAt: new Date(),
          });
        }
      }

      // If we have files to add
      if (newFiles.length > 0) {
        addFiles(newFiles);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Navigate directly to upload preview
        router.push('/modules/upload-preview');
      }

      // Reset the share intent after processing
      resetShareIntent();
    };

    // Small delay to ensure the app is fully mounted and redirect has completed
    setTimeout(processSharedContent, 500);
  }, [hasShareIntent, shareIntent, addFiles, resetShareIntent]);

  return {
    hasSharedContent: hasShareIntent,
    sharedFilesCount: shareIntent?.files?.length || 0,
  };
}
