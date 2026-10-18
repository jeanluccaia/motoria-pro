"use client";

/**
 * Store client-side (localStorage) para o ESTADO DEMONSTRATIVO das ofertas.
 * Nada aqui vai para banco; é apenas para o preview mostrar coerência entre telas.
 */

import { useEffect, useState } from "react";
import type { PlanKey } from "./data";

export type OfferStatus =
  | "none"
  | "prepared"   // oferta preparada
  | "sent"       // enviada ao cliente
  | "interested" // cliente demonstrou interesse
  | "confirmed"; // contrato confirmado (demo)

export type OfferState = {
  customerId: string;
  planKey?: PlanKey;
  kind: "new_subscription" | "upgrade" | "corporate";
  status: OfferStatus;
  updatedAt: string; // ISO
};

const KEY = "dgn-vision-offers-v1";

type Store = Record<string, OfferState>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent("dgn-offers-changed"));
}

export function getOffer(customerId: string): OfferState | undefined {
  return read()[customerId];
}

export function setOffer(state: OfferState) {
  const store = read();
  store[state.customerId] = state;
  write(store);
}

export function clearOffer(customerId: string) {
  const store = read();
  delete store[customerId];
  write(store);
}

export function clearAllOffers() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent("dgn-offers-changed"));
  }
}

/** Hook que escuta mudanças (storage + evento custom). */
export function useOfferState(customerId: string): OfferState | undefined {
  const [state, setState] = useState<OfferState | undefined>();

  useEffect(() => {
    setState(getOffer(customerId));
    const handler = () => setState(getOffer(customerId));
    window.addEventListener("dgn-offers-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("dgn-offers-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, [customerId]);

  return state;
}

export const STATUS_LABEL: Record<OfferStatus, string> = {
  none: "Sem oferta",
  prepared: "Oferta preparada — aguardando envio",
  sent: "Oferta enviada ao cliente",
  interested: "Cliente demonstrou interesse",
  confirmed: "Contrato confirmado (demonstrativo)",
};
