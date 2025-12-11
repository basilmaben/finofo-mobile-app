import {
  ApolloClient,
  ApolloLink,
  InMemoryCache
} from "@apollo/client";
import { authLink, httpLink } from "./links";

export const apolloClient = new ApolloClient({
	link: ApolloLink.from([authLink, httpLink]),
	cache: new InMemoryCache(),
});
