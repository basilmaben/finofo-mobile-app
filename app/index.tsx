import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
	const { user } = useUser();

	return (
		<>
			<SignedIn>
				<View style={styles.container}>
					<Text style={styles.title}>Dashboard</Text>
					<Text style={styles.subtitle}>
						Hello {user?.emailAddresses[0]?.emailAddress ?? "there"} 👋
					</Text>
				</View>
			</SignedIn>

			<SignedOut>
				<Redirect href="/sign-in" />
			</SignedOut>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#111827",
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: "600",
		color: "#F9FAFB",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: "#9CA3AF",
	},
});
