/**
 * Upload Preview Screen
 * Preview captured/selected files before upload
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DocumentTypeSelector, FileThumbnail, NotesInput } from '@/components/documents';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { type DocumentFile, type DocumentType, DocumentTypeLabels } from '@/types/document';

export default function UploadPreviewScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const params = useLocalSearchParams<{ files: string }>();

    // Parse files from params
    const initialFiles: DocumentFile[] = params.files
        ? JSON.parse(params.files).map((f: DocumentFile) => ({
              ...f,
              createdAt: new Date(f.createdAt),
          }))
        : [];

    const [files, setFiles] = useState<DocumentFile[]>(initialFiles);
    const [documentType, setDocumentType] = useState<DocumentType>('packing_slip');
    const [notes, setNotes] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleRemoveFile = useCallback((fileId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
    }, []);

    const handleUpload = async () => {
        if (files.length === 0) {
            Alert.alert('No Files', 'Please add at least one file to upload.');
            return;
        }

        setIsUploading(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // TODO: Implement actual upload logic
        // For now, simulate upload success
        setTimeout(() => {
            setIsUploading(false);
            Alert.alert(
                'Upload Started',
                `${files.length} file(s) queued for upload as "${DocumentTypeLabels[documentType]}"`,
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/(tabs)'),
                    },
                ],
            );
        }, 1000);
    };

    const handleCancel = () => {
        if (files.length > 0) {
            Alert.alert('Discard Files?', 'Are you sure you want to discard these files?', [
                { text: 'Keep Editing', style: 'cancel' },
                {
                    text: 'Discard',
                    style: 'destructive',
                    onPress: () => router.back(),
                },
            ]);
        } else {
            router.back();
        }
    };

    const handleAddMore = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/capture');
    };

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const formatSize = (bytes: number) => {
        if (bytes === 0) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
            edges={['top']}
        >
            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            Review & Upload
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                            {files.length} file{files.length !== 1 ? 's' : ''}
                            {totalSize > 0 ? ` • ${formatSize(totalSize)}` : ''}
                        </Text>
                    </View>
                    <View style={styles.headerButton} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* File Previews */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                            FILES
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filesScroll}
                        >
                            {files.map((file) => (
                                <View key={file.id} style={styles.fileCard}>
                                    <FileThumbnail
                                        file={file}
                                        size="large"
                                        showDetails
                                        onRemove={() => handleRemoveFile(file.id)}
                                    />
                                </View>
                            ))}

                            {/* Add More Button */}
                            <TouchableOpacity
                                style={[
                                    styles.addMoreButton,
                                    {
                                        backgroundColor: colors.cardSecondary,
                                        borderColor: colors.border,
                                    },
                                ]}
                                onPress={handleAddMore}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="add-circle-outline"
                                    size={32}
                                    color={colors.primary}
                                />
                                <Text style={[styles.addMoreText, { color: colors.textMuted }]}>
                                    Add More
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    {/* Document Type Selector */}
                    <View style={styles.section}>
                        <DocumentTypeSelector
                            selectedType={documentType}
                            onSelect={setDocumentType}
                        />
                    </View>

                    {/* Notes Input */}
                    <View style={styles.section}>
                        <NotesInput value={notes} onChangeText={setNotes} />
                    </View>
                </ScrollView>

                {/* Bottom Action Bar */}
                <View
                    style={[
                        styles.bottomBar,
                        { backgroundColor: colors.card, borderTopColor: colors.border },
                    ]}
                >
                    <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: colors.border }]}
                        onPress={handleCancel}
                        disabled={isUploading}
                    >
                        <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                            Cancel
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.uploadButton,
                            { backgroundColor: colors.primary },
                            (isUploading || files.length === 0) && styles.buttonDisabled,
                            Shadows.glow,
                        ]}
                        onPress={handleUpload}
                        disabled={isUploading || files.length === 0}
                        activeOpacity={0.8}
                    >
                        {isUploading ? (
                            <Text style={styles.uploadButtonText}>Uploading...</Text>
                        ) : (
                            <>
                                <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
                                <Text style={styles.uploadButtonText}>Upload</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardAvoid: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    headerButton: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        ...Typography.bodyBold,
    },
    headerSubtitle: {
        ...Typography.small,
        marginTop: 2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    section: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    sectionLabel: {
        ...Typography.small,
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: Spacing.md,
    },
    filesScroll: {
        paddingRight: Spacing.lg,
    },
    fileCard: {
        marginRight: Spacing.md,
    },
    addMoreButton: {
        width: 140,
        height: 180,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    addMoreText: {
        ...Typography.caption,
        fontWeight: '500',
    },
    bottomBar: {
        flexDirection: 'row',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xl,
        borderTopWidth: 1,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        ...Typography.bodyBold,
    },
    uploadButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    uploadButtonText: {
        ...Typography.bodyBold,
        color: '#FFFFFF',
    },
});
