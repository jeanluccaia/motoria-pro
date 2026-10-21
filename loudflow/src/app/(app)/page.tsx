import { redirect } from "next/navigation";

// Loud Flow passou a ser exclusivo do CRM de Franquias nesta fase.
// A home redireciona direto para a lista de leads — os módulos de
// Tarefas / Resultados / etc. ficam no código mas fora da navegação.
export default function HomePage() {
  redirect("/crm/franquias");
}
