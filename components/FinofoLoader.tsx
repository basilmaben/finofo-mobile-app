/**
 * Finofo Loader
 * Calm, minimal loading screen using the actual SVG logo
 */

import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';

interface FinofoLoaderProps {
  message?: string;
  subMessage?: string;
  style?: ViewStyle;
}

export const FinofoLoader = ({
  subMessage = "We're making sure everything is perfect.",
  style,
}: FinofoLoaderProps) => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.95)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Text fade in
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 600,
      delay: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }}
      >
        <FinofoLogo size={56} color="#1D1D20" />
      </Animated.View>

      <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
        <Text style={styles.subMessage}>{subMessage}</Text>
      </Animated.View>
    </View>
  );
};

/**
 * Finofo Logo - Using actual SVG
 */
export const FinofoLogo = ({
  size = 32,
  color = '#1D1D20',
}: {
  size?: number;
  color?: string;
}) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 1.5 20 20"
    >
      <Path
        d="M2 5.6h11.2m2.8 14V8.4M3.5 18.1l8.1-8"
        stroke={color}
        strokeWidth={4}
        fill="none"
      />
    </Svg>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  textContainer: {
    marginTop: 48,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D20',
    textAlign: 'center',
  },
  subMessage: {
    fontSize: 14,
    color: '#717072',
    textAlign: 'center',
    marginTop: 8,
  },
});
