// TEMPORARIO — endpoint diagnostico para conferir se as envs EVO chegaram
// no runtime do Preview. Devolve apenas length + primeiros 8 chars de
// sha256 (fingerprint). NUNCA devolve o valor. Removido apos diagnostico.

import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fp(name: string): string {
  const v = process.env[name];
  if (!v) return "MISSING";
  return `len=${v.length} sha8=${createHash("sha256").update(v, "utf8").digest("hex").slice(0, 8)}`;
}

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.EVO_WEBHOOK_SECRET;
  const provided = request.headers.get("x-evo-webhook-secret") ?? "";
  if (!secret || provided !== secret) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return Response.json({
    ok: true,
    EVO_API_USERNAME: fp("EVO_API_USERNAME"),
    EVO_API_PASSWORD: fp("EVO_API_PASSWORD"),
    EVO_WEBHOOK_SECRET: fp("EVO_WEBHOOK_SECRET"),
    EVO_DEFAULT_ORGANIZATION_SLUG: fp("EVO_DEFAULT_ORGANIZATION_SLUG"),
    EVO_API_BASE_URL: fp("EVO_API_BASE_URL"),
  });
}
