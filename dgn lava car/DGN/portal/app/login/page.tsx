import { redirect } from "next/navigation";

// Rota legada — o Portal real do assinante fica em /entrar.
export default function LegacyLoginRedirect() {
  redirect("/entrar");
}
