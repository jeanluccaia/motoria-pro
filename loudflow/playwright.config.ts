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
