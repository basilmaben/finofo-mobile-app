import { API_BASE_URL } from "@/config/env";
import { HttpLink } from "@apollo/client";

export const httpLink = new HttpLink({
	uri: `${API_BASE_URL}/graphql`,
});