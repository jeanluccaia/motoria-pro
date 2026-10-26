import type { Metadata } from "next";
import { ReconcilerClient } from "./ReconcilerClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reconciliação de assinaturas" };

export default function ReconcileSubscribersPage() {
  return (
    <div className="dgn-page">
      <header className="dgn-page-header">
        <div><p className="dgn-eyebrow">Assinaturas</p><h1>Reconciliação de assinaturas</h1></div>
      </header>
      <ReconcilerClient />
      <p className="mt-6 text-xs leading-relaxed text-white/50">As alterações exigem sua confirmação. Cobranças no PagBank permanecem protegidas.</p>
    </div>
  );
}
