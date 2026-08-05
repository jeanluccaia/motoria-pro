export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing env ${name}. Copie .env.example para .env.local e preencha antes de rodar o app.`,
    );
  }
  return v;
}
