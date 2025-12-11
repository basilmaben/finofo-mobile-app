/**
 * Camera Capture Screen
 * Full-screen camera for document capture - adds to batch
 */

import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { CameraCapture } from '@/components/documents';
import { useFileBatch } from '@/store/file-batch-store';
import type { DocumentFile } from '@/types/document';

export default function CaptureScreen() {
  const { addFiles } = useFileBatch();

  const handleCapture = (files: DocumentFile[]) => {
    // Add captured files to the batch
    addFiles(files);
    // Go back to main screen
    router.back();
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
