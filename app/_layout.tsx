/**
 * Root Layout
 * App navigation structure with authentication providers
 */

import { darkTheme, lightTheme } from "@/config/theme";
import { apolloClient } from "@/graphql/apolloClient";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useHandleShareIntent } from "@/hooks/useShareIntent";
import { ActivityProvider } from "@/store/activity-store";
import { FileBatchProvider } from "@/store/file-batch-store";
import { ApolloProvider } from "@apollo/client/react";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Stack } from "expo-router";
import { ShareIntentProvider } from "expo-share-intent";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";
import { CLERK_PUBLISHABLE_KEY } from "../config/env";

// Inner component that can use the share intent hook (needs to be inside FileBatchProvider)
function AppContent() {
  // Handle files shared from other apps
  useHandleShareIntent();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="modules/upload" />
        <Stack.Screen
          name="modules/capture"
          options={{
            presentation: "fullScreenModal",
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="modules/upload-preview"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ApolloProvider client={apolloClient}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <ShareIntentProvider>
                <ActivityProvider>
                  <FileBatchProvider>
                    <AppContent />
                  </FileBatchProvider>
                </ActivityProvider>
              </ShareIntentProvider>
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </PaperProvider>
      </ApolloProvider>
    </ClerkProvider>
  );
}
