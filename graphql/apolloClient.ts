import {
  ApolloClient,
  ApolloLink,
  InMemoryCache
} from "@apollo/client";
import { authLink } from "./links/authLink";
import { httpLink } from "./links/httpLink";
import { decodeIdLink } from "./links/decodeIdLink";

export const apolloClient = new ApolloClient({
	link: ApolloLink.from([decodeIdLink, authLink, httpLink]),
	cache: new InMemoryCache(),
});
