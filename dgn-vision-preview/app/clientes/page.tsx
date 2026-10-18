import { CUSTOMERS } from "@/lib/data";
import { ClientesList } from "@/components/ClientesList";

export const metadata = {
  title: "Clientes · DGN Vision",
};

export default function ClientesPage() {
  return (
    <div className="px-6 lg:px-10 py-10 lg:py-12 space-y-8">
      <header className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-gold-300">
            Clientes
          </p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-semibold text-white tracking-tight">
            Encontre um cliente em segundos
          </h1>
          <p className="mt-3 text-ink-100 max-w-xl">
            Busque por nome, veículo ou placa. Filtre por tipo de relação e
            abra o perfil 360° para preparar uma oferta.
          </p>
        </div>
        <span className="pill bg-white/5 text-ink-100 border border-white/10">
          {CUSTOMERS.length} clientes demonstrativos
        </span>
      </header>

      <ClientesList />
    </div>
  );
}
