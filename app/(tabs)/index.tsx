/**
 * Document Capture & Upload Screen
 * Main screen for capturing documents via camera, file picker, or share activity
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DocumentFile } from '@/types/document';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function CaptureScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [selectedFiles, setSelectedFiles] = useState<DocumentFile[]>([]);

    // Handle opening camera
    const handleOpenCamera = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/capture');
    };

    // Handle picking from photo library
    const handlePickFromGallery = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                quality: 0.85,
                orderedSelection: true,
            });

            if (!result.canceled && result.assets.length > 0) {
                const files: DocumentFile[] = result.assets.map((asset, index) => ({
                    id: generateId(),
                    uri: asset.uri,
                    name: asset.fileName || `Photo_${index + 1}.jpg`,
                    type: asset.mimeType || 'image/jpeg',
                    size: asset.fileSize || 0,
                    createdAt: new Date(),
                }));

                router.push({
                    pathname: '/upload-preview',
                    params: { files: JSON.stringify(files) },
                });
            }
        } catch (error) {
            console.error('Gallery picker error:', error);
            Alert.alert('Error', 'Failed to access photo library.');
        }
    };

    // Handle picking from files (iCloud, Google Drive, local storage)
    const handlePickFromFiles = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                multiple: true,
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets.length > 0) {
                const files: DocumentFile[] = result.assets.map((asset) => ({
                    id: generateId(),
                    uri: asset.uri,
                    name: asset.name,
                    type: asset.mimeType || 'application/octet-stream',
                    size: asset.size || 0,
                    createdAt: new Date(),
                }));

                router.push({
                    pathname: '/upload-preview',
                    params: { files: JSON.stringify(files) },
                });
            }
        } catch (error) {
            console.error('File picker error:', error);
            Alert.alert('Error', 'Failed to access files.');
        }
    };

    // Source option component
    const SourceOption = ({
        icon,
        title,
        description,
        color,
        onPress,
    }: {
        icon: keyof typeof Ionicons.glyphMap;
        title: string;
        description: string;
        color: string;
        onPress: () => void;
    }) => (
        <TouchableOpacity
            style={[
                styles.sourceOption,
                { backgroundColor: colors.card, borderColor: colors.border },
                Shadows.sm,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.sourceIconContainer, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={32} color={color} />
            </View>
            <View style={styles.sourceContent}>
                <Text style={[styles.sourceTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.sourceDescription, { color: colors.textMuted }]}>
                    {description}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
            edges={['top']}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Upload Document</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Capture or select documents to upload
                    </Text>
                </View>

                {/* Hero Card - Camera Capture */}
                <TouchableOpacity
                    style={[
                        styles.heroCard,
                        { backgroundColor: colors.primary },
                        Shadows.glow,
                    ]}
                    onPress={handleOpenCamera}
                    activeOpacity={0.85}
                >
                    <View style={styles.heroIconContainer}>
                        <Ionicons name="camera" size={48} color="#FFFFFF" />
                    </View>
                    <View style={styles.heroContent}>
                        <Text style={styles.heroTitle}>Scan Document</Text>
                        <Text style={styles.heroDescription}>
                            Capture single or multi-page documents using your camera
                        </Text>
                    </View>
                    <View style={styles.heroArrow}>
                        <Ionicons name="arrow-forward-circle" size={32} color="rgba(255,255,255,0.8)" />
                    </View>
                </TouchableOpacity>

                {/* Other Sources */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Or choose from
                    </Text>

                    <View style={styles.sourcesList}>
                        <SourceOption
                            icon="images"
                            title="Photo Library"
                            description="Select images from your photos"
                            color={colors.success}
                            onPress={handlePickFromGallery}
                        />

                        <SourceOption
                            icon="folder-open"
                            title="Files"
                            description="Browse iCloud, Google Drive, or local storage"
                            color={colors.accent}
                            onPress={handlePickFromFiles}
                        />
                    </View>
                </View>

                {/* Share Activity Info */}
                <View style={styles.section}>
                    <View
                        style={[
                            styles.infoCard,
                            { backgroundColor: colors.cardSecondary, borderColor: colors.border },
                        ]}
                    >
                        <View style={[styles.infoIconContainer, { backgroundColor: `${colors.warning}15` }]}>
                            <Ionicons name="share-outline" size={24} color={colors.warning} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoTitle, { color: colors.text }]}>
                                Share from Other Apps
                            </Text>
                            <Text style={[styles.infoDescription, { color: colors.textMuted }]}>
                                Use the Share button in any app to send documents here
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Supported Formats */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Supported Formats
                    </Text>
                    <View style={styles.formatsRow}>
                        <View style={[styles.formatBadge, { backgroundColor: colors.cardSecondary }]}>
                            <Ionicons name="image" size={16} color={colors.success} />
                            <Text style={[styles.formatText, { color: colors.textSecondary }]}>
                                JPG, PNG
                            </Text>
                        </View>
                        <View style={[styles.formatBadge, { backgroundColor: colors.cardSecondary }]}>
                            <Ionicons name="document-text" size={16} color={colors.primary} />
                            <Text style={[styles.formatText, { color: colors.textSecondary }]}>
                                PDF
                            </Text>
                        </View>
                        <View style={[styles.formatBadge, { backgroundColor: colors.cardSecondary }]}>
                            <Ionicons name="documents" size={16} color={colors.accent} />
                            <Text style={[styles.formatText, { color: colors.textSecondary }]}>
                                Multi-page
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    header: {
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    title: {
        ...Typography.h1,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        ...Typography.body,
    },

    // Hero Card
    heroCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.xl,
    },
    heroIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    heroContent: {
        flex: 1,
    },
    heroTitle: {
        ...Typography.h3,
        color: '#FFFFFF',
        marginBottom: 4,
    },
    heroDescription: {
        ...Typography.caption,
        color: 'rgba(255,255,255,0.85)',
    },
    heroArrow: {
        marginLeft: Spacing.sm,
    },

    // Sections
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        ...Typography.captionBold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.md,
    },

    // Source Options
    sourcesList: {
        gap: Spacing.sm,
    },
    sourceOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
    },
    sourceIconContainer: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    sourceContent: {
        flex: 1,
    },
    sourceTitle: {
        ...Typography.bodyBold,
        marginBottom: 2,
    },
    sourceDescription: {
        ...Typography.caption,
    },

    // Info Card
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
    },
    infoIconContainer: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        ...Typography.captionBold,
        marginBottom: 2,
    },
    infoDescription: {
        ...Typography.small,
    },

    // Formats
    formatsRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    formatBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
    formatText: {
        ...Typography.small,
        fontWeight: '500',
    },
});
