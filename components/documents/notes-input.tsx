/**
 * Notes Input Component
 * Text input for adding notes to documents
 */

import { StyleSheet, Text, TextInput, View } from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface NotesInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}

export function NotesInput({
    value,
    onChangeText,
    placeholder = 'Add notes or description (optional)',
}: NotesInputProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.cardSecondary,
                        borderColor: colors.border,
                        color: colors.text,
                    },
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
    },
    label: {
        ...Typography.captionBold,
        marginBottom: Spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        minHeight: 100,
        ...Typography.body,
    },
});
