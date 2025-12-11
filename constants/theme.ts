/**
 * Finofo Document Upload App Theme
 * Clean black and white design
 */

import { Platform } from 'react-native';

export const Colors = {
    light: {
        // Base
        text: '#000000',
        textSecondary: '#666666',
        textMuted: '#999999',
        background: '#FFFFFF',
        card: '#FFFFFF',
        cardSecondary: '#F5F5F5',
        border: '#E0E0E0',

        // Primary (black)
        tint: '#000000',
        primary: '#000000',
        primaryLight: '#333333',

        // Semantic (grayscale)
        success: '#000000',
        warning: '#666666',
        accent: '#333333',

        // Tab bar
        icon: '#999999',
        tabIconDefault: '#999999',
        tabIconSelected: '#000000',

        // Document types (all black for now)
        invoice: '#000000',
        packingSlip: '#000000',
        po: '#000000',

        // Status
        pending: '#666666',
        uploading: '#000000',
        completed: '#000000',
        failed: '#666666',
    },
    dark: {
        // Base
        text: '#FFFFFF',
        textSecondary: '#AAAAAA',
        textMuted: '#777777',
        background: '#000000',
        card: '#111111',
        cardSecondary: '#1A1A1A',
        border: '#333333',

        // Primary (white)
        tint: '#FFFFFF',
        primary: '#FFFFFF',
        primaryLight: '#CCCCCC',

        // Semantic (grayscale)
        success: '#FFFFFF',
        warning: '#AAAAAA',
        accent: '#CCCCCC',

        // Tab bar
        icon: '#777777',
        tabIconDefault: '#777777',
        tabIconSelected: '#FFFFFF',

        // Document types (all white for now)
        invoice: '#FFFFFF',
        packingSlip: '#FFFFFF',
        po: '#FFFFFF',

        // Status
        pending: '#AAAAAA',
        uploading: '#FFFFFF',
        completed: '#FFFFFF',
        failed: '#AAAAAA',
    },
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};

export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 5,
    },
    glow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
};

export const Fonts = Platform.select({
    ios: {
        sans: 'system-ui',
        serif: 'ui-serif',
        rounded: 'ui-rounded',
        mono: 'ui-monospace',
    },
    default: {
        sans: 'normal',
        serif: 'serif',
        rounded: 'normal',
        mono: 'monospace',
    },
    web: {
        sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        serif: "Georgia, 'Times New Roman', serif",
        rounded: "'SF Pro Rounded', sans-serif",
        mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
});

export const Typography = {
    h1: {
        fontSize: 32,
        fontWeight: '700' as const,
        lineHeight: 40,
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: 24,
        fontWeight: '600' as const,
        lineHeight: 32,
        letterSpacing: -0.3,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600' as const,
        lineHeight: 28,
        letterSpacing: -0.2,
    },
    body: {
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
    },
    bodyBold: {
        fontSize: 16,
        fontWeight: '600' as const,
        lineHeight: 24,
    },
    caption: {
        fontSize: 14,
        fontWeight: '400' as const,
        lineHeight: 20,
    },
    captionBold: {
        fontSize: 14,
        fontWeight: '600' as const,
        lineHeight: 20,
    },
    small: {
        fontSize: 12,
        fontWeight: '500' as const,
        lineHeight: 16,
    },
};
