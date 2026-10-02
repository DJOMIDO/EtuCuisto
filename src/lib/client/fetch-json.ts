/** fetch JSON qui lève une Error avec le message d'erreur renvoyé par l'API. */
export async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const headers = init?.body instanceof FormData ? undefined : { "content-type": "application/json" };
  const res = await fetch(input, { ...init, headers: { ...headers, ...init?.headers } });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Une erreur est survenue, réessaie.");
  return data as T;
}
