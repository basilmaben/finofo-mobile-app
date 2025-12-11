/**
 * Document Capture & Upload Screen
 * Main screen for capturing documents via camera, file picker, or share activity
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DocumentFile } from '@/types/document';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function CaptureScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

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
                        Shadows.md,
                    ]}
                    onPress={handleOpenCamera}
                    activeOpacity={0.85}
                >
                    <View style={styles.heroIconContainer}>
                        <Ionicons name="camera" size={48} color={colors.background} />
                    </View>
                    <View style={styles.heroContent}>
                        <Text style={[styles.heroTitle, { color: colors.background }]}>
                            Scan Document
                        </Text>
                        <Text style={[styles.heroDescription, { color: colors.background, opacity: 0.8 }]}>
                            Capture single or multi-page documents using your camera
                        </Text>
                    </View>
                    <View style={styles.heroArrow}>
                        <Ionicons name="arrow-forward-circle" size={32} color={colors.background} style={{ opacity: 0.6 }} />
                    </View>
                </TouchableOpacity>

                {/* Other Sources */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        Or choose from
                    </Text>

                    <View style={styles.sourcesList}>
                        {/* Photo Library */}
                        <TouchableOpacity
                            style={[
                                styles.sourceOption,
                                { backgroundColor: colors.card, borderColor: colors.border },
                            ]}
                            onPress={handlePickFromGallery}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.sourceIconContainer, { backgroundColor: colors.cardSecondary }]}>
                                <Ionicons name="images" size={28} color={colors.text} />
                            </View>
                            <View style={styles.sourceContent}>
                                <Text style={[styles.sourceTitle, { color: colors.text }]}>
                                    Photo Library
                                </Text>
                                <Text style={[styles.sourceDescription, { color: colors.textMuted }]}>
                                    Select images from your photos
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                        </TouchableOpacity>

                        {/* Files */}
                        <TouchableOpacity
                            style={[
                                styles.sourceOption,
                                { backgroundColor: colors.card, borderColor: colors.border },
                            ]}
                            onPress={handlePickFromFiles}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.sourceIconContainer, { backgroundColor: colors.cardSecondary }]}>
                                <Ionicons name="folder-open" size={28} color={colors.text} />
                            </View>
                            <View style={styles.sourceContent}>
                                <Text style={[styles.sourceTitle, { color: colors.text }]}>
                                    Files
                                </Text>
                                <Text style={[styles.sourceDescription, { color: colors.textMuted }]}>
                                    Browse iCloud, Google Drive, or local storage
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
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
                        <View style={[styles.infoIconContainer, { backgroundColor: colors.card }]}>
                            <Ionicons name="share-outline" size={24} color={colors.text} />
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
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        Supported Formats
                    </Text>
                    <View style={styles.formatsRow}>
                        <View style={[styles.formatBadge, { backgroundColor: colors.cardSecondary }]}>
                            <Ionicons name="image" size={16} color={colors.text} />
                            <Text style={[styles.formatText, { color: colors.textSecondary }]}>
                                JPG, PNG
                            </Text>
                        </View>
                        <View style={[styles.formatBadge, { backgroundColor: colors.cardSecondary }]}>
                            <Ionicons name="document-text" size={16} color={colors.text} />
                            <Text style={[styles.formatText, { color: colors.textSecondary }]}>
                                PDF
                            </Text>
                        </View>
                        <View style={[styles.formatBadge, { backgroundColor: colors.cardSecondary }]}>
                            <Ionicons name="documents" size={16} color={colors.text} />
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
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    heroContent: {
        flex: 1,
    },
    heroTitle: {
        ...Typography.h3,
        marginBottom: 4,
    },
    heroDescription: {
        ...Typography.caption,
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
        width: 52,
        height: 52,
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
