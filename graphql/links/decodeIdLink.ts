import { ApolloLink, Observable } from '@apollo/client';

const isMaybeBase64 = (s: string) =>
  /^[A-Za-z0-9+/=]+$/.test(s) && s.length % 4 === 0;

const decodeBase64 = (s: string): string => {
  try {
    if (typeof atob === 'function') return atob(s);
    return Buffer.from(s, 'base64').toString('utf8');
  } catch {
    return s;
  }
};

const extractUuid = (decoded: string): string => {
  const parts = decoded.split(':');
  return parts.length > 1 ? parts[parts.length - 1] : decoded;
};

function transformIds(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(transformIds);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === 'id' && typeof v === 'string' && isMaybeBase64(v)) {
        const decoded = decodeBase64(v);
        out[k] = extractUuid(decoded) || v;
      } else {
        out[k] = transformIds(v);
      }
    }
    return out;
  }
  return value;
}

export const decodeIdLink = new ApolloLink((operation, forward) => {
  const obs = forward(operation);
  return new Observable<ApolloLink.Result>((subscriber) =>
    obs.subscribe({
      next: (result: ApolloLink.Result) => {
        if (result?.data) {
          const data = JSON.parse(JSON.stringify(result.data));
          subscriber.next({
            ...result,
            data: transformIds(data) as Record<string, unknown>
          });
        } else {
          subscriber.next(result);
        }
      },
      error: (e: unknown) => subscriber.error(e),
      complete: () => subscriber.complete()
    })
  );
});