// Helper local (não versionado por padrão — ver .gitignore do seed) para
// criar o usuário admin@crm.test no Supabase LOCAL e vinculá-lo como admin
// da organização Loud Fit, apenas para capturar os screenshots da UI do
// CRM nesta sessão de validação.
//
// Uso:
//   npm run admin:crm-test-create
//
// Não aplicar em produção — a senha é literal.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltam envs do Supabase.");
  process.exit(1);
}
const admin = createClient(url, key, { auth: { persistSession: false } });

const EMAIL = "admin@crm.test";

async function findUserId() {
  const { data } = await admin.auth.admin.listUsers();
  return data?.users?.find((u) => u.email?.toLowerCase() === EMAIL)?.id ?? null;
}

let userId = await findUserId();
if (!userId) {
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: "Admin-crm-local-2026!",
    email_confirm: true,
    user_metadata: { name: "Admin CRM" },
  });
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  userId = data.user.id;
  console.log("[create-admin] criou auth.user", userId);
} else {
  console.log("[create-admin] usuário já existia", userId);
}

const { data: org } = await admin
  .from("organizations")
  .select("id, name")
  .eq("slug", "loud-fit")
  .single();
if (!org) {
  console.error("Org loud-fit não encontrada. Rode a seed SQL primeiro.");
  process.exit(1);
}

const upUser = await admin
  .from("users")
  .upsert({ id: userId, email: EMAIL, name: "Admin CRM" });
if (upUser.error) {
  console.error("public.users upsert", upUser.error.message);
  process.exit(1);
}

const upMembership = await admin
  .from("user_organizations")
  .upsert({ user_id: userId, organization_id: org.id, role: "admin" });
if (upMembership.error) {
  console.error("user_organizations upsert", upMembership.error.message);
  process.exit(1);
}

console.log(`[create-admin] ok — admin em ${org.name} (${org.id})`);
