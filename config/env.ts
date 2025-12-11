function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

export const CLERK_PUBLISHABLE_KEY = requireEnv(
	"EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
);
