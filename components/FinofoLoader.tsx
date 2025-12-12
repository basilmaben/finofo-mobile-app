/**
 * Finofo Animated Loader
 * Animated loading screen with the Finofo logo mark
 * Matches the web app's loading animation
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
  
  // Animation values for each bar
  const horizontalAnim = useRef(new Animated.Value(0)).current;
  const diagonalAnim = useRef(new Animated.Value(0)).current;
  const verticalAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  // Get size dimensions
  const getDimensions = () => {
    switch (size) {
      case 'small':
        return { container: 40, strokeWidth: 6 };
      case 'large':
        return { container: 80, strokeWidth: 12 };
      default:
        return { container: 56, strokeWidth: 8 };
    }
  };

  const { container, strokeWidth } = getDimensions();

  useEffect(() => {
    // Create looping animation for each bar
    const createBarAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          // Slide in
          Animated.timing(animValue, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          // Hold
          Animated.delay(350),
          // Slide out
          Animated.timing(animValue, {
            toValue: 2,
            duration: 350,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          // Reset
          Animated.delay(150),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Start animations with stagger
    const horizontalLoop = createBarAnimation(horizontalAnim, 0);
    const diagonalLoop = createBarAnimation(diagonalAnim, 100);
    const verticalLoop = createBarAnimation(verticalAnim, 200);

    horizontalLoop.start();
    diagonalLoop.start();
    verticalLoop.start();

    // Fade in text after delay
    if (showText) {
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 300,
        delay: 1000,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      horizontalLoop.stop();
      diagonalLoop.stop();
      verticalLoop.stop();
    };
  }, [showText]);

  // Calculate dimensions based on SVG viewBox (0 0 20 20)
  const scale = container / 20;
  const horizontalWidth = 11.2 * scale;
  const horizontalLeft = 2 * scale;
  const horizontalTop = 5.6 * scale - strokeWidth / 2;
  
  const verticalHeight = 11.6 * scale;
  const verticalLeft = 14.8 * scale - strokeWidth / 2;
  const verticalTop = 8.4 * scale - strokeWidth / 2;
  
  const diagonalWidth = Math.sqrt(8.1 * 8.1 + 8 * 8) * scale; // Pythagorean for diagonal length
  const diagonalLeft = 3.5 * scale;
  const diagonalTop = 10.1 * scale;

  return (
    <View style={[styles.container, style]}>
      {/* Logo mark */}
      <View style={[styles.logoContainer, { width: container, height: container }]}>
        {/* Horizontal bar - top */}
        <View 
          style={[
            styles.barContainer, 
            { 
              height: strokeWidth,
              width: horizontalWidth,
              left: horizontalLeft,
              top: horizontalTop,
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.barFill,
              { 
                transform: [{ 
                  translateX: horizontalAnim.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [-horizontalWidth, 0, horizontalWidth],
                  })
                }] 
              }
            ]} 
          />
        </View>

        {/* Diagonal bar */}
        <View 
          style={[
            styles.barContainer, 
            { 
              height: strokeWidth,
              width: diagonalWidth,
              left: diagonalLeft,
              top: diagonalTop,
              transform: [{ rotate: '-45deg' }],
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.barFill,
              { 
                transform: [{ 
                  translateX: diagonalAnim.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [-diagonalWidth, 0, diagonalWidth],
                  })
                }] 
              }
            ]} 
          />
        </View>

        {/* Vertical bar - right side */}
        <View 
          style={[
            styles.barContainer, 
            { 
              height: strokeWidth,
              width: verticalHeight,
              left: verticalLeft,
              top: verticalTop + verticalHeight / 2,
              transform: [{ rotate: '-90deg' }],
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.barFill,
              { 
                transform: [{ 
                  translateX: verticalAnim.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [-verticalHeight, 0, verticalHeight],
                  })
                }] 
              }
            ]} 
          />
        </View>
      </View>

      {/* Text */}
      {showText && (message || subMessage) && (
        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          {message && (
            <Text 
              variant="bodyMedium" 
              style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
            >
              {message}
            </Text>
          )}
          {subMessage && (
            <Text 
              variant="bodySmall" 
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
 * Static Finofo Logo (no animation)
 */
export const FinofoLogo = ({ 
  size = 24, 
  color = '#1D1D20' 
}: { 
  size?: number; 
  color?: string;
}) => {
  const scale = size / 20;
  const strokeWidth = 4 * scale;
  
  const horizontalWidth = 11.2 * scale;
  const horizontalLeft = 2 * scale;
  const horizontalTop = 5.6 * scale - strokeWidth / 2;
  
  const verticalHeight = 11.6 * scale;
  const verticalLeft = 14.8 * scale - strokeWidth / 2;
  const verticalTop = 8.4 * scale - strokeWidth / 2;
  
  const diagonalWidth = Math.sqrt(8.1 * 8.1 + 8 * 8) * scale;
  const diagonalLeft = 3.5 * scale;
  const diagonalTop = 10.1 * scale;

  return (
    <View style={{ width: size, height: size }}>
      {/* Horizontal */}
      <View 
        style={{
          position: 'absolute',
          height: strokeWidth,
          width: horizontalWidth,
          left: horizontalLeft,
          top: horizontalTop,
          backgroundColor: color,
        }} 
      />
      {/* Diagonal */}
      <View 
        style={{
          position: 'absolute',
          height: strokeWidth,
          width: diagonalWidth,
          left: diagonalLeft,
          top: diagonalTop,
          backgroundColor: color,
          transform: [{ rotate: '-45deg' }],
        }} 
      />
      {/* Vertical */}
      <View 
        style={{
          position: 'absolute',
          height: strokeWidth,
          width: verticalHeight,
          left: verticalLeft,
          top: verticalTop + verticalHeight / 2,
          backgroundColor: color,
          transform: [{ rotate: '-90deg' }],
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
  logoContainer: {
    position: 'relative',
  },
  barContainer: {
    position: 'absolute',
    backgroundColor: '#E5E5E5',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1D1D20',
  },
  textContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
  },
  subMessage: {
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
});
