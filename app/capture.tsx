/**
 * Camera Capture Screen
 * Full-screen camera for document capture
 */

import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { CameraCapture } from '@/components/documents';
import type { DocumentFile } from '@/types/document';

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
