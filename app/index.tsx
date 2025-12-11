import { WireClerk } from "@/graphql/clerkTokenStore";
import { SignedIn, SignedOut } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { Dashboard } from "./modules/Dashboard";

export default function Index() {
	return (
		<>
      <SignedIn>
        <WireClerk />
        <Dashboard />
      </SignedIn>

			<SignedOut>
				<Redirect href="/sign-in" />
			</SignedOut>
		</>
	);
}