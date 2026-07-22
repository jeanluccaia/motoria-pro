/**
 * Chaves modernas sb_secret_ são API keys opacas, não JWTs. O supabase-js
 * ainda pode copiá-las para Authorization; removemos somente esse Bearer
 * inválido e preservamos o cabeçalho apikey, que mantém o acesso server-side.
 */
export const supabaseSecretKeyFetch: typeof fetch = async (input, init) => {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
  const authorization = headers.get("authorization");
  if (authorization?.startsWith("Bearer sb_secret_")) headers.delete("authorization");
  const requestInput = input instanceof Request ? new Request(input, { headers }) : input;
  return fetch(requestInput, { ...init, headers });
};
