import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Solicita um link de recuperação para o e-mail informado.
//
// Segurança:
//   * Resposta é sempre { ok: true } — nunca revelamos se o e-mail
//     existe no sistema (proteção contra enumeração de usuários).
//   * O link real é enviado via SMTP do Supabase (se configurado).
//     Sem SMTP, o admin usa `scripts/send-recovery-links.mjs` para
//     gerar links diretamente e distribuir por canal seguro.
//   * A origem do redirectTo é derivada do host do request — nunca de
//     env — para não emitir links apontando para o ambiente errado
//     (dev/preview/prod).
//   * Restringe ao e-mails autorizados: só dispara para quem já tem
//     perfil em public.users. Fora da lista, devolve ok=true silente
//     sem chamar o Supabase (não gera link, não consome quota).

type BodyIn = { email?: unknown };

async function currentOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  if (!host) throw new Error("host header ausente");
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  let body: BodyIn;
  try {
    body = (await request.json()) as BodyIn;
  } catch {
    return NextResponse.json({ ok: true });
  }
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  // Sempre devolvemos ok=true para não vazar existência do e-mail.
  const opaqueOk = NextResponse.json({ ok: true });
  if (!email || !email.includes("@")) return opaqueOk;

  const admin = getSupabaseAdmin();

  // Pré-checagem: existe em public.users? Se não, ok=true silente.
  const { data: profile } = await admin
    .from("users")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (!profile) return opaqueOk;

  const redirectTo = `${await currentOrigin()}/api/auth/callback?type=recovery`;

  // resetPasswordForEmail no client-side seria mais idiomático, mas
  // aqui usamos generateLink pelo admin para (a) ficar server-side e
  // (b) permitir que o link seja enviado por outro canal quando SMTP
  // não estiver configurado no Supabase. O GoTrue ainda dispara o
  // e-mail via SMTP se configurado — generateLink não desativa isso.
  try {
    await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });
  } catch {
    // Silencioso: erros do provedor não podem vazar para o cliente.
  }

  return opaqueOk;
}
