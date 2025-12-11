import { apolloClient } from "@/graphql/apolloClient";
import { ApolloProvider } from '@apollo/client/react';
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CLERK_PUBLISHABLE_KEY } from "../config/env";

export default function RootLayout() {
	return (
		<ClerkProvider
			publishableKey={CLERK_PUBLISHABLE_KEY}
			tokenCache={tokenCache}
		>
      <ApolloProvider client={apolloClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Slot />
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </ApolloProvider>
		</ClerkProvider>
	);
}
