/**
 * Root Layout
 * App navigation structure with authentication providers
 */

import { apolloClient } from "@/graphql/apolloClient";
import { ApolloProvider } from "@apollo/client/react";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";
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
						<Stack>
							<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
							<Stack.Screen
								name="capture"
								options={{
									headerShown: false,
									presentation: "fullScreenModal",
									animation: "fade",
								}}
							/>
							<Stack.Screen
								name="upload-preview"
								options={{
									headerShown: false,
									presentation: "modal",
									animation: "slide_from_bottom",
								}}
							/>
							<Stack.Screen name="index" options={{ headerShown: false }} />
							<Stack.Screen name="sign-in" options={{ headerShown: false }} />
							<Stack.Screen name="+not-found" />
						</Stack>
						<StatusBar style="auto" />
					</GestureHandlerRootView>
				</SafeAreaProvider>
			</ApolloProvider>
		</ClerkProvider>
	);
}
