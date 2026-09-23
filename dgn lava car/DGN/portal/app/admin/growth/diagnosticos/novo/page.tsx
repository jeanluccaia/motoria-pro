import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DiagnosticForm } from "@/components/growth/diagnostics/DiagnosticForm";
import { DEMO_DIAGNOSTIC_DRAFT } from "@/lib/growth/diagnostics/fixtures";

export const dynamic = "force-dynamic";

// Formulário admin (Fase 0.5). Inicializa com o rascunho fictício;
// o cliente re-hidrata do localStorage se já houver rascunho salvo local.
export default function NovoDiagnosticoPage() {
  return (
    <div className="min-h-dvh bg-[#050505]">
      <div className="px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/admin/growth/diagnosticos"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55 transition hover:text-[#E7C96A]"
          >
            <ArrowLeft size={12} />
            Diagnósticos
          </Link>
        </div>
      </div>
      <DiagnosticForm initial={DEMO_DIAGNOSTIC_DRAFT} />
    </div>
  );
}
