/**
 * Capture Source Modal Component
 * Bottom sheet modal for selecting document capture source
 */

import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CaptureSourceModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectCamera: () => void;
    onSelectGallery: () => void;
    onSelectFiles: () => void;
}

interface SourceOption {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    description: string;
    color: string;
    onPress: () => void;
}

export function CaptureSourceModal({
    visible,
    onClose,
    onSelectCamera,
    onSelectGallery,
    onSelectFiles,
}: CaptureSourceModalProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const options: SourceOption[] = [
        {
            id: 'camera',
            icon: 'camera',
            label: 'Camera',
            description: 'Capture single or multi-page documents',
            color: colors.primary,
            onPress: onSelectCamera,
        },
        {
            id: 'gallery',
            icon: 'images',
            label: 'Photo Library',
            description: 'Select from your photos',
            color: colors.success,
            onPress: onSelectGallery,
        },
        {
            id: 'files',
            icon: 'folder',
            label: 'Browse Files',
            description: 'iCloud, Google Drive, local storage',
            color: colors.accent,
            onPress: onSelectFiles,
        },
    ];

    const handleOptionPress = (option: SourceOption) => {
        onClose();
        // Small delay to let modal close animation complete
        setTimeout(() => {
            option.onPress();
        }, 200);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable
                    style={[styles.sheet, { backgroundColor: colors.card }, Shadows.lg]}
                    onPress={(e) => e.stopPropagation()}
                >
                    {/* Handle */}
                    <View style={styles.handleContainer}>
                        <View style={[styles.handle, { backgroundColor: colors.border }]} />
                    </View>

                    {/* Title */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>Add Document</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Choose how you&apos;d like to add your document
                        </Text>
                    </View>

                    {/* Options */}
                    <View style={styles.options}>
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.option,
                                    {
                                        backgroundColor: colors.cardSecondary,
                                        borderColor: colors.border,
                                    },
                                ]}
                                onPress={() => handleOptionPress(option)}
                                activeOpacity={0.7}
                            >
                                <View
                                    style={[
                                        styles.iconContainer,
                                        { backgroundColor: `${option.color}15` },
                                    ]}
                                >
                                    <Ionicons name={option.icon} size={28} color={option.color} />
                                </View>
                                <View style={styles.optionContent}>
                                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                                        {option.label}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.optionDescription,
                                            { color: colors.textMuted },
                                        ]}
                                    >
                                        {option.description}
                                    </Text>
                                </View>
                                <Ionicons
                                    name="chevron-forward"
                                    size={20}
                                    color={colors.textMuted}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Cancel button */}
                    <TouchableOpacity
                        style={[styles.cancelButton, { backgroundColor: colors.cardSecondary }]}
                        onPress={onClose}
                    >
                        <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                            Cancel
                        </Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        paddingBottom: Spacing.xl,
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    header: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    title: {
        ...Typography.h2,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        ...Typography.caption,
    },
    options: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    optionContent: {
        flex: 1,
    },
    optionLabel: {
        ...Typography.bodyBold,
        marginBottom: 2,
    },
    optionDescription: {
        ...Typography.caption,
    },
    cancelButton: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    cancelText: {
        ...Typography.bodyBold,
    },
});
