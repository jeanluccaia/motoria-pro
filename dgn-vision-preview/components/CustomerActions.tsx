"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OfferSubscription } from "@/components/OfferSubscription";
import { OfferReview } from "@/components/OfferReview";
import { IconArrow } from "@/components/Icons";
import { useOfferState } from "@/lib/offerStore";
import type { Customer } from "@/lib/data";

function ctaLabelFor(customer: Customer, hasOffer: boolean): string {
  if (hasOffer) return "Ver oferta preparada";
  const k = customer.opportunity.kind;
  if (k === "corporate") return "Apresentar Corporate Care";
  if (k === "upgrade") return "Oferecer upgrade";
  return "Oferecer assinatura";
}

/**
 * CTA principal da ficha + barra fixa no mobile (safe-area aware).
 * No desktop, botão inline no hero. No mobile, botão sticky-bottom pra
 * garantir visibilidade mesmo com conteúdo rolado.
 */
export function CustomerActions({ customer }: { customer: Customer }) {
  const router = useRouter();
  const search = useSearchParams();
  const presentFlag = search?.get("present") ?? null;
  const offerState = useOfferState(customer.id);
  const hasOffer = !!offerState && offerState.status !== "none";

  const [offerOpen, setOfferOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [stage, setStage] = useState<"select" | "confirmation">("select");

  // Integração com Modo Apresentação (query param ?present=offer | confirmation)
  useEffect(() => {
    if (presentFlag === "offer") {
      setStage("select");
      setOfferOpen(true);
    } else if (presentFlag === "confirmation") {
      setStage("confirmation");
      setOfferOpen(true);
    } else if (presentFlag !== "prepared") {
      setOfferOpen(false);
    }
  }, [presentFlag]);

  function handleOfferClose(v: boolean) {
    setOfferOpen(v);
    if (!v && presentFlag) {
      const url = new URL(window.location.href);
      url.searchParams.delete("present");
      router.replace(url.pathname + (url.search || ""), { scroll: false });
    }
  }

  function openCta() {
    if (hasOffer) {
      setReviewOpen(true);
    } else {
      setStage("select");
      setOfferOpen(true);
    }
  }

  const label = ctaLabelFor(customer, hasOffer);

  return (
    <>
      <OfferSubscription
        customer={customer}
        open={offerOpen}
        onOpenChange={handleOfferClose}
        initialStage={stage}
        initialPlan={customer.opportunity.recommendedPlan}
      />
      <OfferReview
        customer={customer}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
      />

      {/* Desktop CTA — inline */}
      <button onClick={openCta} className="btn-primary hidden md:inline-flex">
        {label} <IconArrow size={14} />
      </button>

      {/* Mobile CTA — barra fixa com safe-area */}
      <div
        className="fixed bottom-0 inset-x-0 z-30 md:hidden border-t border-white/5 bg-ink-950/95 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="px-4 py-3">
          <button onClick={openCta} className="btn-primary w-full justify-center">
            {label} <IconArrow size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * CTA alternativo usado em blocos secundários (ex: card de condição).
 * Apenas abre o modal de preparação; não substitui a CTA principal.
 */
export function OpportunityLink({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <OfferSubscription
        customer={customer}
        open={open}
        onOpenChange={setOpen}
        initialStage="select"
        initialPlan={customer.opportunity.recommendedPlan}
      />
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-gold-300 hover:text-gold-200 underline underline-offset-4 decoration-gold-400/30 hover:decoration-gold-300"
      >
        Ver oferta recomendada →
      </button>
    </>
  );
}
