"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OfferSubscription } from "@/components/OfferSubscription";
import { IconArrow } from "@/components/Icons";

export function CustomerActions({
  customerFirstName,
  recommended = "priority",
  ctaLabel = "Oferecer assinatura",
}: {
  customerFirstName: string;
  recommended?: "essential" | "smart" | "priority";
  ctaLabel?: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const presentFlag = search.get("present");
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<"select" | "confirmation">("select");

  // Modo Apresentação: ?present=offer abre modal, ?present=confirmation vai pra tela confirmada
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
        customerName={customerFirstName}
        recommended={recommended}
        open={open}
        onOpenChange={handleOpenChange}
        initialStage={stage}
        initialPlan={recommended}
      />
      <button
        onClick={() => {
          setStage("select");
          setOpen(true);
        }}
        className="btn-primary"
      >
        {ctaLabel} <IconArrow size={14} />
      </button>
    </>
  );
}

export function OpportunityLink({
  customerFirstName,
  recommended = "priority",
}: {
  customerFirstName: string;
  recommended?: "essential" | "smart" | "priority";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <OfferSubscription
        customerName={customerFirstName}
        recommended={recommended}
        open={open}
        onOpenChange={setOpen}
        initialStage="select"
        initialPlan={recommended}
      />
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-gold-300 hover:text-gold-200 underline underline-offset-4 decoration-gold-400/30 hover:decoration-gold-300"
      >
        Abrir oferta de assinatura →
      </button>
    </>
  );
}
