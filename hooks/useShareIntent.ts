/**
 * Hook to handle files shared from other apps
 * Uses expo-share-intent to receive shared images and PDFs
 */

import * as Haptics from 'expo-haptics';
import { router, usePathname, useRootNavigationState } from 'expo-router';
import { useShareIntent } from 'expo-share-intent';
import { useEffect, useRef } from 'react';
import { useFileBatch } from '@/store/file-batch-store';
import type { DocumentFile } from '@/types/document';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Check if pathname is a share intent deep link route (not a valid app route)
const isShareIntentRoute = (path: string | null) => {
  if (!path) return false;
  return path.includes('dataUrl') || path.includes('ShareKey');
};

export function useHandleShareIntent() {
  const { shareIntent, resetShareIntent, hasShareIntent } = useShareIntent();
  const { addFiles } = useFileBatch();
  const processedIntentRef = useRef<string | null>(null);
  const pathname = usePathname();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Wait for navigation to be ready before processing
    if (!navigationState?.key) {
      return;
    }

    if (!hasShareIntent || !shareIntent) {
      return;
    }

    // Create a unique key for this intent to prevent double processing
    const intentKey = JSON.stringify(shareIntent);
    if (processedIntentRef.current === intentKey) {
      return;
    }

    // If we're on a share intent route, wait for NotFound to handle navigation
    // The effect will re-run once the pathname changes
    if (isShareIntentRoute(pathname)) {
      console.log('[ShareIntent] On share intent route, waiting for redirect...');
      return;
    }

    // Mark as processed BEFORE processing to prevent race conditions
    processedIntentRef.current = intentKey;

    console.log('[ShareIntent] Processing share intent on route:', pathname);

    const processSharedContent = () => {
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
        
        // Check if we're already on the upload-preview screen
        const isOnUploadPreview = pathname === '/modules/upload-preview';
        
        if (isOnUploadPreview) {
          // Already on upload-preview - just added files, no navigation needed
          console.log('[ShareIntent] Already on upload-preview, files added');
        } else {
          // Not on upload-preview - navigate to it
          console.log('[ShareIntent] Navigating to upload-preview from:', pathname);
          // Small delay to ensure state is settled
          setTimeout(() => {
            router.push('/modules/upload-preview');
          }, 100);
        }
      }

      // Reset the share intent after processing
      resetShareIntent();
    };

    // Process immediately - we've already verified we're on a valid route
    processSharedContent();
  }, [hasShareIntent, shareIntent, addFiles, resetShareIntent, pathname, navigationState?.key]);

  return {
    hasSharedContent: hasShareIntent,
    sharedFilesCount: shareIntent?.files?.length || 0,
  };
}
