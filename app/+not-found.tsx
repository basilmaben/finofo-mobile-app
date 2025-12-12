/**
 * Not Found / Deep Link Handler
 * Catches unmatched routes (like share intent deep links) and redirects to home
 */

import { Redirect, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function NotFoundScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const pathname = usePathname();

  useEffect(() => {
    // Log the unmatched route for debugging
    console.log('[NotFound] Unmatched route:', pathname);
  }, [pathname]);

  // Check if this is a share intent deep link
  const isShareIntentLink = pathname?.includes('dataUrl') || pathname?.includes('ShareKey');

  if (isShareIntentLink) {
    // This is a share intent - redirect to home, the ShareIntentProvider will handle the data
    return <Redirect href="/" />;
  }

  // For any other unmatched route, redirect to home
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Redirect href="/" />
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


