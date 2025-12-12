/**
 * Not Found / Deep Link Handler
 * Catches unmatched routes (like share intent deep links) and redirects to home
 */

import { router, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function NotFoundScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const pathname = usePathname();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirectedRef.current) {
      return;
    }

    // Log the unmatched route for debugging
    console.log('[NotFound] Unmatched route:', pathname);

    // Check if this is a share intent deep link
    const isShareIntentLink = pathname?.includes('dataUrl') || pathname?.includes('ShareKey');

    if (isShareIntentLink) {
      // For share intent links, DON'T navigate - just go back to dismiss this screen
      // The share intent hook will handle everything from the current screen
      console.log('[NotFound] Share intent detected, going back');
      hasRedirectedRef.current = true;
      
      setTimeout(() => {
        // Use back() to return to whatever screen was open before
        // This prevents stacking issues when app is already open
        if (router.canGoBack()) {
          router.back();
        } else {
          // Fresh launch - need to go to home
          router.replace('/');
        }
      }, 50);
      return;
    }

    // For other unmatched routes, redirect to home
    hasRedirectedRef.current = true;
    setTimeout(() => {
      router.replace('/');
    }, 50);
  }, [pathname]);

  // Show nothing for share intent (transparent transition)
  // This prevents flashing a loading screen
  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


