/**
 * Camera Capture Component
 * Full-screen camera for capturing document images (single & multi-page)
 */

import { Ionicons } from '@expo/vector-icons';
import { type CameraType, CameraView, type FlashMode, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import type { DocumentFile } from '@/types/document';

interface CameraCaptureProps {
    onCapture: (files: DocumentFile[]) => void;
    onClose: () => void;
    multiPage?: boolean;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function CameraCapture({ onCapture, onClose, multiPage = true }: CameraCaptureProps) {
    const insets = useSafeAreaInsets();
    const cameraRef = useRef<CameraView>(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<CameraType>('back');
    const [flash, setFlash] = useState<FlashMode>('off');
    const [capturedImages, setCapturedImages] = useState<DocumentFile[]>([]);
    const [isCapturing, setIsCapturing] = useState(false);

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission, requestPermission]);

    const handleCapture = async () => {
        if (!cameraRef.current || isCapturing) return;

        setIsCapturing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.85,
                skipProcessing: Platform.OS === 'android',
            });

            if (photo) {
                const newFile: DocumentFile = {
                    id: generateId(),
                    uri: photo.uri,
                    name: `Document_Page_${capturedImages.length + 1}.jpg`,
                    type: 'image/jpeg',
                    size: 0,
                    createdAt: new Date(),
                };

                if (multiPage) {
                    setCapturedImages((prev) => [...prev, newFile]);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onCapture([newFile]);
                }
            }
        } catch (error) {
            console.error('Camera capture error:', error);
            Alert.alert('Capture Failed', 'Failed to capture image. Please try again.');
        } finally {
            setIsCapturing(false);
        }
    };

    const handleRemoveImage = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCapturedImages((prev) => prev.filter((img) => img.id !== id));
    };

    const handleDone = () => {
        if (capturedImages.length > 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onCapture(capturedImages);
        } else {
            onClose();
        }
    };

    const toggleFlash = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFlash((prev) => (prev === 'off' ? 'on' : 'off'));
    };

    const toggleFacing = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
    };

    // Permission loading state
    if (!permission) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={64} color="rgba(255,255,255,0.5)" />
                    <Text style={styles.permissionText}>Initializing camera...</Text>
                </View>
            </View>
        );
    }

    // Permission denied state
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={80} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.permissionTitle}>Camera Access Required</Text>
                    <Text style={styles.permissionText}>
                        Grant camera permission to capture documents
                    </Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Ionicons name="checkmark-circle" size={20} color="#000000" />
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelLink} onPress={onClose}>
                        <Text style={styles.cancelLinkText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Camera (no children allowed) */}
            <CameraView ref={cameraRef} style={styles.camera} facing={facing} flash={flash} />

            {/* Overlay UI (absolutely positioned on top of camera) */}
            <View style={styles.overlay} pointerEvents="box-none">
                {/* Top Controls */}
                <View style={[styles.topBar, { top: insets.top + 12 }]}>
                    <TouchableOpacity style={styles.iconButton} onPress={onClose}>
                        <Ionicons name="close" size={28} color="#FFFFFF" />
                    </TouchableOpacity>

                    <View style={styles.topRightControls}>
                        <TouchableOpacity style={styles.iconButton} onPress={toggleFlash}>
                            <Ionicons
                                name={flash === 'on' ? 'flash' : 'flash-off'}
                                size={24}
                                color="#FFFFFF"
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton} onPress={toggleFacing}>
                            <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Document Frame Guide */}
                <View style={[styles.frameGuide, { top: insets.top + 80 }]} pointerEvents="none">
                    <View style={styles.frameContainer}>
                        <View style={[styles.corner, styles.topLeftCorner]} />
                        <View style={[styles.corner, styles.topRightCorner]} />
                        <View style={[styles.corner, styles.bottomLeftCorner]} />
                        <View style={[styles.corner, styles.bottomRightCorner]} />
                    </View>
                    <Text style={styles.frameHint}>Align document within frame</Text>
                </View>

                {/* Captured Pages Preview (Multi-page mode) */}
                {multiPage && capturedImages.length > 0 && (
                    <View style={styles.previewSection}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.previewScroll}
                        >
                            {capturedImages.map((file, index) => (
                                <View key={file.id} style={styles.previewCard}>
                                    <Image source={{ uri: file.uri }} style={styles.previewImage} />
                                    <View style={styles.pageLabel}>
                                        <Text style={styles.pageLabelText}>{index + 1}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => handleRemoveImage(file.id)}
                                    >
                                        <Ionicons name="close" size={14} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Bottom Controls */}
                <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
                    {/* Page Counter */}
                    {multiPage && (
                        <View style={styles.pageCounter}>
                            <Ionicons name="documents-outline" size={18} color="#FFFFFF" />
                            <Text style={styles.pageCounterText}>
                                {capturedImages.length} page{capturedImages.length !== 1 ? 's' : ''}
                            </Text>
                        </View>
                    )}

                    {/* Capture Controls */}
                    <View style={styles.captureRow}>
                        {/* Done Button (when pages captured) */}
                        {multiPage && capturedImages.length > 0 ? (
                            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                                <Ionicons name="checkmark" size={22} color="#000000" />
                                <Text style={styles.doneButtonText}>Done</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.placeholderButton} />
                        )}

                        {/* Shutter Button */}
                        <TouchableOpacity
                            style={[
                                styles.shutterButton,
                                isCapturing && styles.shutterButtonActive,
                            ]}
                            onPress={handleCapture}
                            disabled={isCapturing}
                            activeOpacity={0.7}
                        >
                            <View style={styles.shutterInner} />
                        </TouchableOpacity>

                        {/* Add Page Button (multi-page) or placeholder */}
                        {multiPage && capturedImages.length > 0 ? (
                            <TouchableOpacity style={styles.addPageButton} onPress={handleCapture}>
                                <Ionicons name="add" size={24} color="#000000" />
                                <Text style={styles.addPageText}>Add</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.placeholderButton} />
                        )}
                    </View>

                    {/* Hint Text */}
                    <Text style={styles.captureHint}>
                        {multiPage
                            ? capturedImages.length === 0
                                ? 'Tap to capture first page'
                                : 'Add more pages or tap Done'
                            : 'Tap to capture document'}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    permissionContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    permissionTitle: {
        ...Typography.h2,
        color: '#FFFFFF',
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    permissionText: {
        ...Typography.body,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },
    permissionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
    permissionButtonText: {
        ...Typography.bodyBold,
        color: '#000000',
    },
    cancelLink: {
        marginTop: Spacing.lg,
        padding: Spacing.sm,
    },
    cancelLinkText: {
        ...Typography.body,
        color: 'rgba(255,255,255,0.6)',
    },

    // Top Bar
    topBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        zIndex: 10,
    },
    topRightControls: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Frame Guide
    frameGuide: {
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: 280,
        alignItems: 'center',
        justifyContent: 'center',
    },
    frameContainer: {
        flex: 1,
        width: '100%',
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    topLeftCorner: {
        top: 0,
        left: 0,
        borderTopWidth: 3,
        borderLeftWidth: 3,
        borderTopLeftRadius: 12,
    },
    topRightCorner: {
        top: 0,
        right: 0,
        borderTopWidth: 3,
        borderRightWidth: 3,
        borderTopRightRadius: 12,
    },
    bottomLeftCorner: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
        borderBottomLeftRadius: 12,
    },
    bottomRightCorner: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 3,
        borderRightWidth: 3,
        borderBottomRightRadius: 12,
    },
    frameHint: {
        ...Typography.caption,
        color: 'rgba(255,255,255,0.7)',
        marginTop: Spacing.md,
    },

    // Preview Section
    previewSection: {
        position: 'absolute',
        bottom: 220,
        left: 0,
        right: 0,
    },
    previewScroll: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
    },
    previewCard: {
        width: 70,
        height: 90,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        backgroundColor: '#333',
        marginRight: Spacing.sm,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    pageLabel: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    pageLabelText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    removeButton: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#333333',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Bottom Bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: Spacing.lg,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
    },
    pageCounter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: Spacing.md,
    },
    pageCounterText: {
        ...Typography.captionBold,
        color: '#FFFFFF',
    },
    captureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xl,
    },
    placeholderButton: {
        width: 70,
    },
    doneButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
        minWidth: 70,
        justifyContent: 'center',
    },
    doneButtonText: {
        ...Typography.captionBold,
        color: '#000000',
    },
    shutterButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 5,
        borderColor: '#FFFFFF',
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shutterButtonActive: {
        transform: [{ scale: 0.92 }],
    },
    shutterInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
    },
    addPageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
        minWidth: 70,
        justifyContent: 'center',
    },
    addPageText: {
        ...Typography.captionBold,
        color: '#000000',
    },
    captureHint: {
        ...Typography.caption,
        color: 'rgba(255,255,255,0.6)',
        marginTop: Spacing.md,
    },
});
