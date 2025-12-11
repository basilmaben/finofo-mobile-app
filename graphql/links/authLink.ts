import { SetContextLink } from '@apollo/client/link/context';

// Voodoo to prevent silly re-rendering caused by clerk
let tokenGetter: () => Promise<string | null | undefined> = async () => null;
export const wireTokenGetter = (
  fn: () => Promise<string | null | undefined>
) => {
  tokenGetter = fn;
};

export const authLink = new SetContextLink(async ({ headers }) => {
  try {
    const token = await tokenGetter();
    return {
      headers: {
        ...headers,
        // Use canonical casing to be safe
        Authorization: token ? `Bearer ${token}` : undefined
      }
    };
  } catch {
    return { headers };
  }
});