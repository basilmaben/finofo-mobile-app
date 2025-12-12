/**
 * Finofo Animated Loader
 * Clean, minimal loading screen with the Finofo logo mark
 */

import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface FinofoLoaderProps {
  message?: string;
  subMessage?: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  showText?: boolean;
}

export const FinofoLoader = ({
  message = 'Please wait...',
  subMessage = "We're making sure everything is perfect.",
  size = 'medium',
  style,
  showText = true,
}: FinofoLoaderProps) => {
  const theme = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  const logoSize = size === 'small' ? 48 : size === 'large' ? 80 : 64;

  useEffect(() => {
    // Subtle pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Fade in text
    if (showText) {
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        delay: 600,
        useNativeDriver: true,
      }).start();
    }

    return () => pulse.stop();
  }, [showText]);

  return (
    <View style={[styles.container, style]}>
      {/* Animated Logo */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <FinofoLogo size={logoSize} color="#1D1D20" />
      </Animated.View>

      {/* Text */}
      {showText && (message || subMessage) && (
        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          {message && (
            <Text 
              variant="bodyLarge" 
              style={[styles.message, { color: theme.colors.onSurface }]}
            >
              {message}
            </Text>
          )}
          {subMessage && (
            <Text 
              variant="bodyMedium" 
              style={[styles.subMessage, { color: theme.colors.onSurfaceVariant }]}
            >
              {subMessage}
            </Text>
          )}
        </Animated.View>
      )}
    </View>
  );
};

/**
 * Finofo Logo Component
 * Renders the Finofo "F" mark
 * Based on SVG: M2 5.6h11.2 (horizontal), vertical at right, diagonal from bottom-left
 */
export const FinofoLogo = ({ 
  size = 24, 
  color = '#1D1D20' 
}: { 
  size?: number; 
  color?: string;
}) => {
  const strokeWidth = size * 0.24; // Thinner strokes for more spacing
  const halfStroke = strokeWidth / 2;

  return (
    <View style={{ width: size, height: size }}>
      {/* Horizontal bar - top */}
      <View 
        style={{
          position: 'absolute',
          left: size * 0.05,
          top: size * 0.2 - halfStroke,
          width: size * 0.55,
          height: strokeWidth,
          backgroundColor: color,
        }} 
      />
      
      {/* Vertical bar - right side */}
      <View 
        style={{
          position: 'absolute',
          left: size * 0.8 - halfStroke,
          top: size * 0.35,
          width: strokeWidth,
          height: size * 0.6,
          backgroundColor: color,
        }} 
      />
      
      {/* Diagonal bar */}
      <View 
        style={{
          position: 'absolute',
          left: size * 0.12,
          top: size * 0.52,
          width: size * 0.52,
          height: strokeWidth,
          backgroundColor: color,
          transform: [{ rotate: '-45deg' }],
        }} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  textContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    fontWeight: '600',
  },
  subMessage: {
    textAlign: 'center',
    marginTop: 6,
  },
});
