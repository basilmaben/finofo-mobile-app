/**
 * Toast Notification System
 * Provides beautiful, animated toast notifications with various types
 * Uses React Native Paper's Snackbar with custom styling and animations
 */

import * as Haptics from 'expo-haptics';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon, Text, useTheme, type MD3Theme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface ToastConfig {
  id?: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // in ms, 0 for persistent
  action?: ToastAction;
  onDismiss?: () => void;
  haptic?: boolean;
}

interface ToastState extends ToastConfig {
  id: string;
  visible: boolean;
}

interface ToastContextType {
  show: (config: ToastConfig) => string;
  hide: (id?: string) => void;
  hideAll: () => void;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  loading: (message: string, title?: string) => string;
  update: (id: string, config: Partial<ToastConfig>) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Toast colors for different types
const getToastColors = (type: ToastType, theme: MD3Theme) => {
  switch (type) {
    case 'success':
      return {
        background: '#059669', // Emerald-600
        foreground: '#FFFFFF',
        icon: 'check-circle',
        accent: '#34D399', // Emerald-400
      };
    case 'error':
      return {
        background: '#DC2626', // Red-600
        foreground: '#FFFFFF',
        icon: 'alert-circle',
        accent: '#F87171', // Red-400
      };
    case 'warning':
      return {
        background: '#D97706', // Amber-600
        foreground: '#FFFFFF',
        icon: 'alert',
        accent: '#FBBF24', // Amber-400
      };
    case 'info':
      return {
        background: '#2563EB', // Blue-600
        foreground: '#FFFFFF',
        icon: 'information',
        accent: '#60A5FA', // Blue-400
      };
    case 'loading':
      return {
        background: theme.colors.surfaceVariant,
        foreground: theme.colors.onSurfaceVariant,
        icon: 'loading',
        accent: theme.colors.primary,
      };
  }
};

// Individual Toast Component
const ToastItem = ({
  toast,
  onDismiss,
  index,
}: {
  toast: ToastState;
  onDismiss: () => void;
  index: number;
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  const colors = getToastColors(toast.type, theme);

  useEffect(() => {
    if (toast.visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      // Start spinning animation for loading type
      if (toast.type === 'loading') {
        Animated.loop(
          Animated.timing(spinValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ).start();
      }
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [toast.visible, toast.type]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          top: insets.top + 8 + index * 80,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.toast, { backgroundColor: colors.background }]}
        onPress={handleDismiss}
        activeOpacity={0.9}
      >
        {/* Accent bar */}
        <View style={[styles.accentBar, { backgroundColor: colors.accent }]} />

        {/* Icon */}
        <View style={styles.iconContainer}>
          {toast.type === 'loading' ? (
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Icon source="loading" size={24} color={colors.foreground} />
            </Animated.View>
          ) : (
            <Icon source={colors.icon} size={24} color={colors.foreground} />
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {toast.title && (
            <Text
              variant="labelLarge"
              style={[styles.title, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {toast.title}
            </Text>
          )}
          <Text
            variant="bodyMedium"
            style={[styles.message, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {toast.message}
          </Text>
        </View>

        {/* Action */}
        {toast.action && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              toast.action?.onPress();
              handleDismiss();
            }}
          >
            <Text
              variant="labelMedium"
              style={[styles.actionText, { color: colors.accent }]}
            >
              {toast.action.label}
            </Text>
          </TouchableOpacity>
        )}

        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon source="close" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Toast Provider
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const hide = useCallback((id?: string) => {
    setToasts((prev) => {
      if (id) {
        return prev.map((t) => (t.id === id ? { ...t, visible: false } : t));
      }
      // Hide the most recent toast
      const lastVisible = [...prev].reverse().find((t) => t.visible);
      if (lastVisible) {
        return prev.map((t) =>
          t.id === lastVisible.id ? { ...t, visible: false } : t
        );
      }
      return prev;
    });

    // Clear timeout if exists
    if (id && timeoutsRef.current.has(id)) {
      clearTimeout(timeoutsRef.current.get(id));
      timeoutsRef.current.delete(id);
    }

    // Remove from DOM after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.visible));
    }, 300);
  }, []);

  const hideAll = useCallback(() => {
    setToasts((prev) => prev.map((t) => ({ ...t, visible: false })));
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current.clear();

    setTimeout(() => {
      setToasts([]);
    }, 300);
  }, []);

  const show = useCallback(
    (config: ToastConfig): string => {
      const id = config.id || generateId();
      const duration = config.duration ?? 4000;

      // Haptic feedback
      if (config.haptic !== false) {
        switch (config.type) {
          case 'success':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'error':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
          case 'warning':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
          default:
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }

      const toast: ToastState = {
        ...config,
        id,
        visible: true,
      };

      // Remove any existing toast with same ID
      setToasts((prev) => {
        const filtered = prev.filter((t) => t.id !== id);
        return [...filtered, toast];
      });

      // Auto-hide after duration (unless 0 for persistent)
      if (duration > 0) {
        const timeout = setTimeout(() => {
          hide(id);
        }, duration);
        timeoutsRef.current.set(id, timeout);
      }

      return id;
    },
    [hide]
  );

  const update = useCallback((id: string, config: Partial<ToastConfig>) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...config } : t))
    );
  }, []);

  // Convenience methods
  const success = useCallback(
    (message: string, title?: string) =>
      show({ type: 'success', message, title }),
    [show]
  );

  const error = useCallback(
    (message: string, title?: string) =>
      show({ type: 'error', message, title, duration: 6000 }),
    [show]
  );

  const warning = useCallback(
    (message: string, title?: string) =>
      show({ type: 'warning', message, title }),
    [show]
  );

  const info = useCallback(
    (message: string, title?: string) => show({ type: 'info', message, title }),
    [show]
  );

  const loading = useCallback(
    (message: string, title?: string) =>
      show({ type: 'loading', message, title, duration: 0 }),
    [show]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  return (
    <ToastContext.Provider
      value={{
        show,
        hide,
        hideAll,
        success,
        error,
        warning,
        info,
        loading,
        update,
      }}
    >
      {children}
      {/* Render toasts */}
      <View style={styles.toastRoot} pointerEvents="box-none">
        {toasts
          .filter((t) => t.visible)
          .map((toast, index) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => {
                toast.onDismiss?.();
                hide(toast.id);
              }}
              index={index}
            />
          ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    paddingRight: 40,
    minHeight: 56,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    opacity: 0.9,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionText: {
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    opacity: 0.7,
  },
});

