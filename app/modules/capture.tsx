/**
 * Camera Capture Screen
 * Full-screen camera for document capture - adds to batch
 */

import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { CameraCapture } from '@/components/documents';
import { useFileBatch } from '@/store/file-batch-store';
import type { DocumentFile } from '@/types/document';

export default function CaptureScreen() {
  const { addFiles } = useFileBatch();
  const { returnToPreview } = useLocalSearchParams<{ returnToPreview?: string }>();

  const handleCapture = (files: DocumentFile[]) => {
    // Add captured files to the batch
    addFiles(files);
    
    // If we came from upload-preview, just go back to it
    // Otherwise navigate to upload-preview
    if (returnToPreview === 'true') {
      router.back();
    } else {
      router.replace('/modules/upload-preview');
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <CameraCapture onCapture={handleCapture} onClose={handleClose} multiPage={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
