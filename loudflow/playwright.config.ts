import { defineConfig } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Testes de RLS são API-only (Supabase JS + service_role/anon).
// Sem browser: não precisa `npx playwright install`.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env.test.local", override: true });

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: false,
  reporter: [["list"]],
});
