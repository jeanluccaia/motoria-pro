import "server-only";

import type { NextRequest } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "@/lib/growth/admin-session";
import { logLlmError } from "@/lib/growth/agent/agent-provider";

// Health check admin-guarded. Executa uma chamada mínima ao Anthropic com a
// MESMA configuração do LlmAgentProvider (modelo + temperature), SEM tools
// e SEM system prompt. Serve para isolar problemas de auth/billing/modelo
// da camada de tool calling. Nunca expõe a chave nem headers.

const HEALTH_MODEL_ID = "claude-sonnet-4-6";
const HEALTH_TEMPERATURE = 0.2;
const HEALTH_PROMPT = "Responda apenas OK";

interface HealthResult {
  success: boolean;
  model: string;
  status: "ok" | "error";
  text?: string;
  latencyMs: number;
  error?: {
    name: string;
    status: number | null;
    code: string | null;
    message: string;
  };
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get(DGN_ADMIN_COOKIE)?.value;
  if (!(await validateAdminSessionToken(session))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const startedAt = performance.now();

  try {
    const result = await generateText({
      model: anthropic(HEALTH_MODEL_ID),
      messages: [{ role: "user", content: HEALTH_PROMPT }],
      temperature: HEALTH_TEMPERATURE,
    });

    const payload: HealthResult = {
      success: true,
      model: HEALTH_MODEL_ID,
      status: "ok",
      text: (result.text ?? "").trim().slice(0, 40),
      latencyMs: Math.round(performance.now() - startedAt),
    };
    return Response.json(payload);
  } catch (error) {
    logLlmError("health-check", error);
    const info = sanitize(error);
    const payload: HealthResult = {
      success: false,
      model: HEALTH_MODEL_ID,
      status: "error",
      latencyMs: Math.round(performance.now() - startedAt),
      error: info,
    };
    return Response.json(payload, { status: 200 }); // 200 para o cliente conseguir ler o JSON
  }
}

function sanitize(error: unknown) {
  const name = (error as { name?: unknown })?.name;
  const rawMessage = (error as { message?: unknown })?.message;
  const message = typeof rawMessage === "string" ? rawMessage.slice(0, 300) : "";
  const status = pickNumber([
    (error as { status?: unknown })?.status,
    (error as { statusCode?: unknown })?.statusCode,
    (error as { response?: { status?: unknown } })?.response?.status,
  ]);
  const code = pickString([
    (error as { code?: unknown })?.code,
    (error as { error?: { type?: unknown } })?.error?.type,
    (error as { data?: { error?: { type?: unknown } } })?.data?.error?.type,
    (error as { type?: unknown })?.type,
  ]);
  return {
    name: typeof name === "string" ? name : "UnknownError",
    status,
    code,
    message,
  };
}

function pickNumber(candidates: unknown[]): number | null {
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) return c;
  }
  return null;
}

function pickString(candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) return c.trim().slice(0, 80);
  }
  return null;
}
