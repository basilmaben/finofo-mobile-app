/**
 * File Thumbnail Component
 * Displays a preview of an uploaded file with remove option
 */

import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { DocumentFile } from '@/types/document';

interface FileThumbnailProps {
    file: DocumentFile;
    onRemove?: () => void;
    size?: 'small' | 'medium' | 'large';
    showDetails?: boolean;
}

const sizeMap = {
    small: 64,
    medium: 100,
    large: 140,
};

export function FileThumbnail({
    file,
    onRemove,
    size = 'medium',
    showDetails = false,
}: FileThumbnailProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const dimension = sizeMap[size];

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (): keyof typeof Ionicons.glyphMap => {
        if (isPdf) return 'document-text';
        if (isImage) return 'image';
        return 'document';
    };

    return (
        <View style={[styles.container, showDetails && styles.containerWithDetails]}>
            <View
                style={[
                    styles.thumbnail,
                    {
                        width: dimension,
                        height: dimension,
                        backgroundColor: colors.cardSecondary,
                        borderColor: colors.border,
                    },
                    Shadows.sm,
                ]}
            >
                {isImage ? (
                    <Image source={{ uri: file.uri }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={styles.iconContainer}>
                        <Ionicons name={getFileIcon()} size={dimension * 0.4} color={colors.text} />
                        {isPdf && (
                            <Text style={[styles.pdfLabel, { color: colors.text }]}>PDF</Text>
                        )}
                    </View>
                )}

                {onRemove && (
                    <TouchableOpacity
                        style={[styles.removeButton, { backgroundColor: colors.text }]}
                        onPress={onRemove}
                        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    >
                        <Ionicons name="close" size={14} color={colors.background} />
                    </TouchableOpacity>
                )}
            </View>

            {showDetails && (
                <View style={styles.details}>
                    <Text
                        style={[styles.fileName, { color: colors.text }]}
                        numberOfLines={2}
                        ellipsizeMode="middle"
                    >
                        {file.name}
                    </Text>
                    {file.size > 0 && (
                        <Text style={[styles.fileSize, { color: colors.textMuted }]}>
                            {formatFileSize(file.size)}
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    containerWithDetails: {
        maxWidth: 140,
    },
    thumbnail: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        borderWidth: 1,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    iconContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pdfLabel: {
        ...Typography.small,
        fontWeight: '700',
        marginTop: 4,
    },
    removeButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    details: {
        marginTop: Spacing.sm,
        alignItems: 'center',
    },
    fileName: {
        ...Typography.small,
        textAlign: 'center',
    },
    fileSize: {
        ...Typography.small,
        fontSize: 10,
        marginTop: 2,
    },
});
