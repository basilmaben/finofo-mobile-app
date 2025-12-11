/**
 * Camera Capture Screen
 * Full-screen camera for document capture
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { CameraCapture } from '@/components/documents';
import { DocumentFile } from '@/types/document';

export default function CaptureScreen() {
  const handleCapture = (files: DocumentFile[]) => {
    router.replace({
      pathname: '/upload-preview',
      params: { files: JSON.stringify(files) },
    });
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <CameraCapture
        onCapture={handleCapture}
        onClose={handleClose}
        multiPage={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

