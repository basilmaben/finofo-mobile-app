import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

export default function SignInScreen() {
	const { signIn, isLoaded, setActive } = useSignIn();
	const router = useRouter();

	const [emailAddress, setEmailAddress] = useState("");
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const onSignInPress = async () => {
		if (!isLoaded || isSubmitting) return;
		setIsSubmitting(true);
		setError(null);

		try {
			const result = await signIn.create({
				identifier: emailAddress,
				password,
			});

			if (result.status === "complete") {
				await setActive({ session: result.createdSessionId });
				router.replace("/"); // go to dashboard
			} else {
				// Could handle more steps here (MFA, etc.)
				console.log("Sign-in not complete:", JSON.stringify(result, null, 2));
			}
		} catch (err: unknown) {
			console.error("Sign in error", JSON.stringify(err, null, 2));
			setError("Invalid credentials or sign-in failed.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Sign in</Text>

			<TextInput
				style={styles.input}
				placeholder="Email"
				placeholderTextColor="#6B7280"
				autoCapitalize="none"
				keyboardType="email-address"
				value={emailAddress}
				onChangeText={setEmailAddress}
			/>

			<TextInput
				style={styles.input}
				placeholder="Password"
				placeholderTextColor="#6B7280"
				secureTextEntry
				value={password}
				onChangeText={setPassword}
			/>

			{error && <Text style={styles.error}>{error}</Text>}

			<TouchableOpacity
				style={[styles.button, isSubmitting && styles.buttonDisabled]}
				onPress={onSignInPress}
				disabled={isSubmitting}
			>
				{isSubmitting ? (
					<ActivityIndicator />
				) : (
					<Text style={styles.buttonText}>Continue</Text>
				)}
			</TouchableOpacity>

			{/* Optional: link to sign-up route when you add it */}
			{/* <Text style={styles.helperText}>Don't have an account yet?</Text> */}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#020617",
		alignItems: "stretch",
		justifyContent: "center",
		paddingHorizontal: 24,
	},
	title: {
		fontSize: 28,
		fontWeight: "600",
		color: "#F9FAFB",
		marginBottom: 24,
		textAlign: "center",
	},
	input: {
		backgroundColor: "#0F172A",
		borderRadius: 10,
		paddingHorizontal: 14,
		paddingVertical: 12,
		color: "#E5E7EB",
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#1F2937",
	},
	button: {
		marginTop: 8,
		backgroundColor: "#2563EB",
		borderRadius: 10,
		paddingVertical: 12,
		alignItems: "center",
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	buttonText: {
		color: "#F9FAFB",
		fontSize: 16,
		fontWeight: "600",
	},
	error: {
		color: "#F97373",
		marginBottom: 8,
		textAlign: "center",
	},
	helperText: {
		marginTop: 12,
		color: "#9CA3AF",
		textAlign: "center",
	},
});
