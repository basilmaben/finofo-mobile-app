import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import * as React from 'react';
import {
  Alert,
  StyleSheet,
} from 'react-native';
import {
  FAB,
  List,
  Text,
  useTheme,
} from 'react-native-paper';
import { useFileBatch } from '@/store/file-batch-store';
import type { DocumentFile } from '@/types/document';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Supported image types (no HEIC!)
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const isSupportedImageType = (mimeType: string | null | undefined): boolean => {
  if (!mimeType) return false;
  return SUPPORTED_IMAGE_TYPES.includes(mimeType.toLowerCase());
};

interface UploadButtonProps {
  /** If true, won't navigate to upload-preview after adding files (useful when already on that screen) */
  skipNavigation?: boolean;
}

export const UploadButton = ({ skipNavigation = false }: UploadButtonProps) => {
  const theme = useTheme();
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const snapPoints = React.useMemo(() => ['35%'], []);
  const { files, addFiles } = useFileBatch();

  const handleOpenSheet = React.useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleCloseSheet = React.useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  // Handle picking from files (iCloud, Google Drive, local storage)
  // Only accept PDF, JPEG, PNG
  const handlePickFromFiles = async () => {
    handleCloseSheet();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newFiles: DocumentFile[] = result.assets.map((asset) => ({
          id: generateId(),
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
          createdAt: new Date(),
        }));
        addFiles(newFiles);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        if (!skipNavigation) {
          router.push('/modules/upload-preview');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to access files.');
    }
  };

  // Handle opening camera (scan document)
  const handleOpenCamera = () => {
    handleCloseSheet();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Pass returnToPreview param if we're already on the upload-preview screen
    if (skipNavigation) {
      router.push('/modules/capture?returnToPreview=true');
    } else {
      router.push('/modules/capture');
    }
  };

  // Handle picking from photo library
  const handlePickFromGallery = async () => {
    handleCloseSheet();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.85,
        orderedSelection: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        // Filter out unsupported types (like HEIC)
        const supportedAssets = result.assets.filter(asset => isSupportedImageType(asset.mimeType));
        const skippedCount = result.assets.length - supportedAssets.length;
        
        if (skippedCount > 0) {
          Alert.alert(
            'Unsupported Format',
            `${skippedCount} file(s) were skipped. Only JPEG and PNG images are supported.`
          );
        }
        
        if (supportedAssets.length === 0) {
          return;
        }
        
        // Get file sizes for each asset (ImagePicker doesn't always provide them)
        const newFiles: DocumentFile[] = await Promise.all(
          supportedAssets.map(async (asset, index) => {
            let fileSize = asset.fileSize || 0;
            
            // If fileSize is 0, try to get it from FileSystem (may fail for ph:// URIs)
            if (fileSize === 0) {
              try {
                const fileInfo = await FileSystem.getInfoAsync(asset.uri);
                if (fileInfo.exists && fileInfo.size !== undefined) {
                  fileSize = fileInfo.size;
                }
              } catch {
                // Ignore - will use default below
              }
            }
            
            // Ensure we always have a valid file size (API requires >= 1)
            if (fileSize === 0) {
              // Estimate based on image dimensions if available, otherwise use default
              const width = asset.width || 1000;
              const height = asset.height || 1000;
              // Rough estimate: compressed JPEG is about 0.5-1 bytes per pixel
              fileSize = Math.max(width * height * 0.75, 50000); // At least 50KB
            }
            
            return {
              id: generateId(),
              uri: asset.uri,
              name: asset.fileName || `Photo_${files.length + index + 1}.jpg`,
              type: asset.mimeType || 'image/jpeg',
              size: Math.round(fileSize),
              createdAt: new Date(),
            };
          })
        );
        
        addFiles(newFiles);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        if (!skipNavigation) {
          router.push('/modules/upload-preview');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to access photo library.');
    }
  };

  return (
    <>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleOpenSheet}
      />

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.onSurfaceVariant }}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text variant="titleMedium" style={[styles.sheetTitle, { color: theme.colors.onSurface }]}>
            Add Document
          </Text>
          <List.Item
            title="Upload Files"
            left={(props) => <List.Icon {...props} icon="folder-upload" />}
            onPress={handlePickFromFiles}
            style={styles.sheetItem}
          />
          <List.Item
            title="Scan Document"
            left={(props) => <List.Icon {...props} icon="camera" />}
            onPress={handleOpenCamera}
            style={styles.sheetItem}
          />
          <List.Item
            title="Gallery"
            left={(props) => <List.Icon {...props} icon="image-multiple" />}
            onPress={handlePickFromGallery}
            style={styles.sheetItem}
          />
        </BottomSheetView>
      </BottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    borderRadius: 28,
    right: 24,
    bottom: 80,
  },
  sheetContent: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  sheetTitle: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    fontWeight: '600',
  },
  sheetItem: {
    paddingHorizontal: 24,
  },
});
