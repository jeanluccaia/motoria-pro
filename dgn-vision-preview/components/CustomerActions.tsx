"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OfferSubscription } from "@/components/OfferSubscription";
import { IconArrow } from "@/components/Icons";
import type { Customer } from "@/lib/data";

function ctaLabelFor(customer: Customer): string {
  const k = customer.opportunity.kind;
  if (k === "corporate") return "Apresentar Corporate Care";
  if (k === "upgrade") return "Oferecer upgrade";
  return "Oferecer assinatura";
}

export function CustomerActions({ customer }: { customer: Customer }) {
  const router = useRouter();
  const search = useSearchParams();
  const presentFlag = search?.get("present") ?? null;
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<"select" | "confirmation">("select");

  // Integração com Modo Apresentação
  useEffect(() => {
    if (presentFlag === "offer") {
      setStage("select");
      setOpen(true);
    } else if (presentFlag === "confirmation") {
      setStage("confirmation");
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [presentFlag]);

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v && presentFlag) {
      const url = new URL(window.location.href);
      url.searchParams.delete("present");
      router.replace(url.pathname + (url.search || ""), { scroll: false });
    }
  }

  return (
    <>
      <OfferSubscription
        customer={customer}
        open={open}
        onOpenChange={handleOpenChange}
        initialStage={stage}
        initialPlan={customer.opportunity.recommendedPlan}
      />
      <button
        onClick={() => {
          setStage("select");
          setOpen(true);
        }}
        className="btn-primary"
      >
        {ctaLabelFor(customer)} <IconArrow size={14} />
      </button>
    </>
  );
}

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
        {ctaLabelFor(customer)} →
      </button>
    </>
  );
}
