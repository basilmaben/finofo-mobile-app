import {
  ApolloClient,
  ApolloLink,
  InMemoryCache
} from "@apollo/client";
import { authLink } from "./links/authLink";
import { httpLink } from "./links/httpLink";

export const apolloClient = new ApolloClient({
	link: ApolloLink.from([authLink, httpLink]),
	cache: new InMemoryCache(),
});
