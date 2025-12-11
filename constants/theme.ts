/**
 * Finofo Document Upload App Theme
 * A sophisticated, modern design system with deep navy and coral accents
 */

import { Platform } from 'react-native';

// Primary palette - Deep navy with warm coral accent
const primaryNavy = '#0F1729';
const primaryNavyLight = '#1A2744';
const coralAccent = '#FF6B5B';
const coralAccentLight = '#FF8577';
const mintGreen = '#00D9A5';
const mintGreenLight = '#4AEDC4';
const warmGold = '#FFB84D';
const softPurple = '#A78BFA';

// Light theme colors
const lightBg = '#F8FAFC';
const lightCard = '#FFFFFF';
const lightCardSecondary = '#F1F5F9';
const lightBorder = '#E2E8F0';
const lightTextPrimary = '#0F172A';
const lightTextSecondary = '#64748B';
const lightTextMuted = '#94A3B8';

// Dark theme colors
const darkBg = '#0A0F1C';
const darkCard = '#151D2E';
const darkCardSecondary = '#1E293B';
const darkBorder = '#2D3B4F';
const darkTextPrimary = '#F1F5F9';
const darkTextSecondary = '#94A3B8';
const darkTextMuted = '#64748B';

export const Colors = {
  light: {
    // Base colors
    text: lightTextPrimary,
    textSecondary: lightTextSecondary,
    textMuted: lightTextMuted,
    background: lightBg,
    card: lightCard,
    cardSecondary: lightCardSecondary,
    border: lightBorder,
    
    // Brand colors
    tint: coralAccent,
    primary: coralAccent,
    primaryLight: coralAccentLight,
    secondary: primaryNavy,
    secondaryLight: primaryNavyLight,
    
    // Semantic colors
    success: mintGreen,
    successLight: mintGreenLight,
    warning: warmGold,
    accent: softPurple,
    
    // Tab bar
    icon: lightTextMuted,
    tabIconDefault: lightTextMuted,
    tabIconSelected: coralAccent,
    
    // Document types
    invoice: '#FF6B5B',
    packingSlip: '#00D9A5',
    po: '#A78BFA',
    
    // Status colors
    pending: warmGold,
    uploading: coralAccent,
    completed: mintGreen,
    failed: '#EF4444',
    
    // Gradients
    gradientStart: '#FF6B5B',
    gradientEnd: '#FF8577',
    headerGradientStart: primaryNavy,
    headerGradientEnd: primaryNavyLight,
  },
  dark: {
    // Base colors
    text: darkTextPrimary,
    textSecondary: darkTextSecondary,
    textMuted: darkTextMuted,
    background: darkBg,
    card: darkCard,
    cardSecondary: darkCardSecondary,
    border: darkBorder,
    
    // Brand colors
    tint: coralAccent,
    primary: coralAccent,
    primaryLight: coralAccentLight,
    secondary: '#E2E8F0',
    secondaryLight: '#F8FAFC',
    
    // Semantic colors
    success: mintGreen,
    successLight: mintGreenLight,
    warning: warmGold,
    accent: softPurple,
    
    // Tab bar
    icon: darkTextMuted,
    tabIconDefault: darkTextMuted,
    tabIconSelected: coralAccent,
    
    // Document types
    invoice: '#FF6B5B',
    packingSlip: '#00D9A5',
    po: '#A78BFA',
    
    // Status colors
    pending: warmGold,
    uploading: coralAccent,
    completed: mintGreen,
    failed: '#EF4444',
    
    // Gradients
    gradientStart: '#FF6B5B',
    gradientEnd: '#FF8577',
    headerGradientStart: darkCard,
    headerGradientEnd: darkCardSecondary,
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
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 5,
  },
  glow: {
    shadowColor: coralAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS system fonts */
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
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
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
    letterSpacing: 0,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  captionBold: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  small: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
};
