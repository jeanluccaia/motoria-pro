import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function CadastroPage() {
  // Não permitimos auto-cadastro pelo Portal. Vínculo é feito pela equipe DGN.
  redirect("/entrar");
}
