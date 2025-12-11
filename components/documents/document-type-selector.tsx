/**
 * Document Type Selector Component
 * Allows user to select the type of document being uploaded
 */

import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DocumentType, DocumentTypeLabels } from '@/types/document';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface DocumentTypeSelectorProps {
    selectedType: DocumentType;
    onSelect: (type: DocumentType) => void;
}

const documentTypes: { type: DocumentType; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
    {
        type: 'packing_slip',
        icon: 'cube-outline',
        description: 'Shipping & receiving',
    },
    {
        type: 'invoice',
        icon: 'document-text-outline',
        description: 'Billing documents',
    },
    {
        type: 'invoice_packing_slip',
        icon: 'documents-outline',
        description: 'Combined docs',
    },
];

export function DocumentTypeSelector({ selectedType, onSelect }: DocumentTypeSelectorProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: colors.text }]}>Document Type</Text>
            <View style={styles.optionsContainer}>
                {documentTypes.map(({ type, icon, description }) => {
                    const isSelected = selectedType === type;
                    const typeColor = type === 'packing_slip'
                        ? colors.packingSlip
                        : type === 'invoice'
                            ? colors.invoice
                            : colors.po;

                    return (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.option,
                                {
                                    backgroundColor: isSelected ? typeColor : colors.card,
                                    borderColor: isSelected ? typeColor : colors.border,
                                },
                                isSelected && Shadows.md,
                            ]}
                            onPress={() => onSelect(type)}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.iconContainer,
                                    {
                                        backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : colors.cardSecondary,
                                    },
                                ]}
                            >
                                <Ionicons
                                    name={icon}
                                    size={24}
                                    color={isSelected ? '#FFFFFF' : typeColor}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.optionLabel,
                                    { color: isSelected ? '#FFFFFF' : colors.text },
                                ]}
                                numberOfLines={1}
                            >
                                {DocumentTypeLabels[type]}
                            </Text>
                            <Text
                                style={[
                                    styles.optionDescription,
                                    { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textMuted },
                                ]}
                                numberOfLines={1}
                            >
                                {description}
                            </Text>
                            {isSelected && (
                                <View style={styles.checkmark}>
                                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
    },
    title: {
        ...Typography.captionBold,
        marginBottom: Spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    optionsContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    option: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        alignItems: 'center',
        position: 'relative',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    optionLabel: {
        ...Typography.captionBold,
        textAlign: 'center',
        marginBottom: 2,
    },
    optionDescription: {
        ...Typography.small,
        textAlign: 'center',
    },
    checkmark: {
        position: 'absolute',
        top: Spacing.xs,
        right: Spacing.xs,
    },
});

