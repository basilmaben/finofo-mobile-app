import { darkTheme, lightTheme } from "@/config/theme";
import { apolloClient } from "@/graphql/apolloClient";
import { ApolloProvider } from '@apollo/client/react';
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Slot } from "expo-router";
import { useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CLERK_PUBLISHABLE_KEY } from "../config/env";

export default function RootLayout() {
  const [isDark] = useState(false);

  const theme = isDark ? darkTheme : lightTheme;
	return (
		<ClerkProvider
			publishableKey={CLERK_PUBLISHABLE_KEY}
			tokenCache={tokenCache}
		>
      <ApolloProvider client={apolloClient}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <Slot />
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </PaperProvider>
      </ApolloProvider>
		</ClerkProvider>
	);
}
