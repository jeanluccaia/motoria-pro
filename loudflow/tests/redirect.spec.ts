import { test, expect } from "@playwright/test";
import {
  safeNext,
  buildEmailRedirectTo,
  DEFAULT_NEXT,
  NEXT_COOKIE,
} from "../src/lib/auth/redirect";

// Higiene de login — proteções contra open-redirect no fluxo do Magic
// Link. Se qualquer um desses casos quebrar, a página de login pode ser
// abusada para redirecionar o usuário autenticado para um host externo.
// Nunca vale confiar em `next` cru.
//
// Contrato desde a migração para o fluxo SSR (verifyOtp + token_hash):
//   * `buildEmailRedirectTo(origin)` devolve SÓ a origem, sem path e
//     sem query. Quem monta `/auth/confirm?token_hash=...` é o template
//     do Supabase via `{{ .RedirectTo }}` — duplicar aqui geraria path
//     quebrado (`.../resultados/auth/confirm?token_hash=...`).
//   * `next` viaja via cookie NEXT_COOKIE, gravado no navegador que
//     pediu o link. Cross-device (Mail WebView no celular, link
//     clicado no desktop) o cookie não existe — o /auth/confirm cai no
//     DEFAULT_NEXT. Sessão continua sendo criada.

test.describe("safeNext", () => {
  test("aceita path interno absoluto simples", () => {
    expect(safeNext("/")).toBe("/");
    expect(safeNext("/resultados")).toBe("/resultados");
    expect(safeNext("/config/campanhas")).toBe("/config/campanhas");
    expect(safeNext("/tarefas?p=high")).toBe("/tarefas?p=high");
  });

  test("null/undefined/empty caem no fallback", () => {
    expect(safeNext(null)).toBe(DEFAULT_NEXT);
    expect(safeNext(undefined)).toBe(DEFAULT_NEXT);
    expect(safeNext("")).toBe(DEFAULT_NEXT);
    expect(safeNext("   ")).toBe(DEFAULT_NEXT);
  });

  test("não começa com '/' → fallback", () => {
    expect(safeNext("resultados")).toBe(DEFAULT_NEXT);
    expect(safeNext("evil.com")).toBe(DEFAULT_NEXT);
    expect(safeNext("javascript:alert(1)")).toBe(DEFAULT_NEXT);
  });

  test("protocol-relative '//host' é rejeitado", () => {
    expect(safeNext("//evil.com")).toBe(DEFAULT_NEXT);
    expect(safeNext("//evil.com/path")).toBe(DEFAULT_NEXT);
    expect(safeNext("//attacker.example/?next=/resultados")).toBe(DEFAULT_NEXT);
  });

  test("backslash trick '/\\host' é rejeitado (browsers normalizam para '//')", () => {
    expect(safeNext("/\\evil.com")).toBe(DEFAULT_NEXT);
    expect(safeNext("/\\/evil.com/x")).toBe(DEFAULT_NEXT);
  });

  test("esquema absoluto embutido no path é rejeitado", () => {
    // "/https://evil.com" começa com "/" mas embute um esquema depois.
    expect(safeNext("/https://evil.com")).toBe(DEFAULT_NEXT);
    expect(safeNext("/javascript:alert(1)")).toBe(DEFAULT_NEXT);
    expect(safeNext("/mailto:a@b")).toBe(DEFAULT_NEXT);
  });

  test("fallback customizado é respeitado", () => {
    expect(safeNext(null, "/tarefas")).toBe("/tarefas");
    expect(safeNext("//evil.com", "/config")).toBe("/config");
  });

  test("DEFAULT_NEXT aponta para /resultados", () => {
    expect(DEFAULT_NEXT).toBe("/resultados");
  });
});

test.describe("buildEmailRedirectTo (fluxo SSR — bare origin)", () => {
  test("devolve a origem crua, sem path e sem query", () => {
    expect(buildEmailRedirectTo("https://loudflow-abc.vercel.app")).toBe(
      "https://loudflow-abc.vercel.app",
    );
    expect(buildEmailRedirectTo("https://loudflow.com.br")).toBe(
      "https://loudflow.com.br",
    );
    expect(buildEmailRedirectTo("http://localhost:3000")).toBe(
      "http://localhost:3000",
    );
  });

  test("não injeta /auth/confirm nem /api/auth/callback", () => {
    // Se voltarmos a duplicar o path aqui, o template do Supabase gera
    // `<origin>/auth/confirm/auth/confirm?token_hash=...` — link quebrado.
    const url = buildEmailRedirectTo("https://loudflow-preview.vercel.app");
    expect(url).not.toContain("/auth/confirm");
    expect(url).not.toContain("/api/auth");
    expect(url).not.toContain("?");
    expect(url).not.toContain("next=");
  });

  test("nenhum localhost é embutido implicitamente pela lógica", () => {
    const url = buildEmailRedirectTo("https://loudflow-preview.vercel.app");
    expect(url).not.toContain("localhost");
    expect(url).toBe("https://loudflow-preview.vercel.app");
  });
});

test.describe("NEXT_COOKIE — contrato de nome", () => {
  test("NEXT_COOKIE tem nome estável — mudar quebra /auth/confirm", () => {
    // /auth/confirm lê `lf_next` do jar de cookies. Se este nome muda
    // sem atualizar o route handler, o destino do Magic Link é perdido
    // silenciosamente em cross-device.
    expect(NEXT_COOKIE).toBe("lf_next");
  });
});

test.describe("Integração com `new URL(next, origin)` do /auth/confirm", () => {
  test("path interno resolve dentro da origem que atendeu o confirm", () => {
    const origin = "https://loudflow-preview.vercel.app";
    const dest = new URL(safeNext("/resultados"), origin);
    expect(dest.toString()).toBe(`${origin}/resultados`);
  });

  test("mesmo com next malicioso, destino final permanece na origem", () => {
    const origin = "https://loudflow-preview.vercel.app";
    // Caso o atacante consiga injetar `//evil.com` no query, safeNext
    // devolve "/resultados" e `new URL(...)` cola no origin — nunca em
    // evil.com. Sem safeNext, `new URL("//evil.com/x", origin)` iria
    // resolver como `https://evil.com/x`.
    const dest = new URL(safeNext("//evil.com/x"), origin);
    expect(dest.origin).toBe(origin);
    expect(dest.toString()).toBe(`${origin}/resultados`);
  });

  test("localhost do dev não é usado no Preview", () => {
    // Confirma expectativa arquitetural: o /auth/confirm constrói
    // destino sempre a partir de `url.origin` (a origem em que a
    // request chegou), não de uma env fixa. Simulamos as 3 origens
    // típicas.
    for (const origin of [
      "http://localhost:3000",
      "https://loudflow-abc.vercel.app",
      "https://loudflow.com.br",
    ]) {
      const dest = new URL(safeNext("/tarefas"), origin);
      expect(dest.toString()).toBe(`${origin}/tarefas`);
    }
  });
});
