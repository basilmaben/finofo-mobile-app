/**
 * Root Layout
 * App navigation structure with authentication providers
 */

import { apolloClient } from "@/graphql/apolloClient";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useHandleShareIntent } from "@/hooks/use-share-intent";
import { FileBatchProvider } from "@/store/file-batch-store";
import { ApolloProvider } from "@apollo/client/react";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { ShareIntentProvider } from "expo-share-intent";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";
import { CLERK_PUBLISHABLE_KEY } from "../config/env";

export const unstable_settings = {
  anchor: "(tabs)",
};

// Custom themes matching our design system
const FinofoLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const FinofoDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

// Inner component that can use the share intent hook (needs to be inside FileBatchProvider)
function AppContent() {
  const colorScheme = useColorScheme();

  // Handle files shared from other apps
  useHandleShareIntent();

  return (
    <ThemeProvider
      value={colorScheme === "dark" ? FinofoDarkTheme : FinofoLightTheme}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="capture"
          options={{
            presentation: "fullScreenModal",
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="upload-preview"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen name="index" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="modules" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ApolloProvider client={apolloClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ShareIntentProvider>
              <FileBatchProvider>
                <AppContent />
              </FileBatchProvider>
            </ShareIntentProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </ApolloProvider>
    </ClerkProvider>
  );
}
