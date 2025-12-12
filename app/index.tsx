import { FinofoLoader } from "@/components/FinofoLoader";
import { WireClerk } from "@/graphql/clerkTokenStore";
import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { View } from "react-native";
import Dashboard from "./modules/dashboard";

export default function Index() {
	const { isLoaded } = useAuth();

	if (!isLoaded) {
		return (
			<View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
				<FinofoLoader 
					subMessage="Setting up your workspace"
				/>
			</View>
		);
	}

	return (
		<>
			<SignedIn>
				<WireClerk />
				<Dashboard />
			</SignedIn>

			<SignedOut>
				<Redirect href="/modules/sign-in" />
			</SignedOut>
		</>
	);
}
