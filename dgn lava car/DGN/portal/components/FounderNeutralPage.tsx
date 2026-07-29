"use client";

import { FounderPublicTracking } from "@/components/FounderPublicTracking";

export function FounderNeutralPage({ slug, name, isTest }: { slug: string; name: string; isTest: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070707] px-5 text-white">
      <FounderPublicTracking slug={slug} />
      <section className="w-full max-w-xl rounded-2xl border border-[#C9A84C]/20 bg-[#101010] p-8 text-center">
        {isTest ? <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">Ambiente de teste</p> : null}
        <h1 className="mt-3 text-3xl font-semibold">{name}</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#A7A7A7]">Convite Founder DGN Club.</p>
        <p className="mt-2 text-sm leading-relaxed text-[#777]">Os detalhes deste convite ainda não foram publicados.</p>
      </section>
    </main>
  );
}
