import { test, expect } from "@playwright/test";
import { safeNext, DEFAULT_NEXT } from "../src/lib/auth/redirect";

// Higiene do parâmetro `next` no /login e no /api/auth/signin — se
// safeNext falhar, o form pode ser abusado para redirecionar o usuário
// autenticado para um host externo. Nunca vale confiar em `next` cru.

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

test.describe("Integração com `new URL(next, origin)` após signInWithPassword", () => {
  test("path interno resolve dentro da origem que atendeu o POST", () => {
    const origin = "https://loudflow-preview.vercel.app";
    const dest = new URL(safeNext("/resultados"), origin);
    expect(dest.toString()).toBe(`${origin}/resultados`);
  });

  test("mesmo com next malicioso, destino final permanece na origem", () => {
    const origin = "https://loudflow-preview.vercel.app";
    const dest = new URL(safeNext("//evil.com/x"), origin);
    expect(dest.origin).toBe(origin);
    expect(dest.toString()).toBe(`${origin}/resultados`);
  });

  test("localhost do dev não é usado no Preview", () => {
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
