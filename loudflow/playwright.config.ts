import { defineConfig } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Testes de RLS são API-only (Supabase JS + service_role/anon).
// Sem browser: não precisa `npx playwright install`.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env.test.local", override: true });

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  fullyParallel: false,
  // Capamos em 2 workers para evitar dois modos de falha reproduzíveis no
  // Windows durante o cold start (sem conexão HTTPS quente para o Supabase):
  //   (a) libuv async.c "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)"
  //       que quebra o worker com STATUS_STACK_BUFFER_OVERRUN (0xC0000409);
  //   (b) resposta transiente do edge do Supabase "JWT issued at future"
  //       quando várias escritas concorrentes atingem o edge ao mesmo tempo.
  // Com 2 workers paralelizamos entre os specs sem disparar o burst que causa
  // essas condições. O padrão de 4 CPUs/2 = 4 workers reproduz a falha em 1
  // execução cold a cada ~4 tentativas.
  workers: 2,
  reporter: [["list"]],
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
  webServer: {
    command: "npm run dev",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
