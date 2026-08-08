import { test, expect } from "@playwright/test";
import { safeNext, buildEmailRedirectTo, DEFAULT_NEXT } from "../src/lib/auth/redirect";

// Fase 3.2A / higiene de login — proteções contra open-redirect no fluxo
// do Magic Link. Se qualquer um desses casos quebrar, a página de login
// pode ser abusada para redirecionar o usuário autenticado para um host
// externo. Nunca vale confiar em `next` cru.

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

test.describe("buildEmailRedirectTo", () => {
  test("usa origin passado literalmente (browser fornece window.location.origin)", () => {
    const url = buildEmailRedirectTo("https://loudflow-abc.vercel.app", "/resultados");
    expect(url).toBe("https://loudflow-abc.vercel.app/api/auth/callback?next=%2Fresultados");
  });

  test("funciona igual para produção, Preview e localhost", () => {
    expect(buildEmailRedirectTo("https://loudflow.com.br", "/tarefas")).toBe(
      "https://loudflow.com.br/api/auth/callback?next=%2Ftarefas",
    );
    expect(buildEmailRedirectTo("https://loudflow-git-xyz-team.vercel.app", "/config")).toBe(
      "https://loudflow-git-xyz-team.vercel.app/api/auth/callback?next=%2Fconfig",
    );
    expect(buildEmailRedirectTo("http://localhost:3000", "/resultados")).toBe(
      "http://localhost:3000/api/auth/callback?next=%2Fresultados",
    );
  });

  test("`next` malicioso é neutralizado antes de entrar na querystring", () => {
    const url = buildEmailRedirectTo("https://loudflow.com.br", "//evil.com/x");
    // Passa por safeNext → cai no fallback /resultados, nunca "//evil.com/x".
    expect(url).toBe("https://loudflow.com.br/api/auth/callback?next=%2Fresultados");

    const url2 = buildEmailRedirectTo("https://loudflow.com.br", "https://evil.com");
    expect(url2).toBe("https://loudflow.com.br/api/auth/callback?next=%2Fresultados");
  });

  test("nenhum localhost é embutido implicitamente pela lógica", () => {
    // O helper NUNCA injeta origem por conta própria: se o chamador der
    // uma URL de Preview, o resultado tem a URL de Preview.
    const url = buildEmailRedirectTo("https://loudflow-preview.vercel.app", "/");
    expect(url).not.toContain("localhost");
    expect(url.startsWith("https://loudflow-preview.vercel.app/")).toBe(true);
  });
});

test.describe("Integração com `new URL(next, origin)` do callback", () => {
  test("path interno resolve dentro da origem do callback", () => {
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
    // Confirma expectativa arquitetural: o callback constrói destino
    // sempre a partir de `url.origin` (a origem em que a request chegou),
    // não de uma env fixa. Simulamos as 3 origens típicas.
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
