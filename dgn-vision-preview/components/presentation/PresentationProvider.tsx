"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SCENES, type Scene } from "./scenes";
import { assertDataConsistency } from "@/lib/data";

type Ctx = {
  active: boolean;
  stepIndex: number;
  totalSteps: number;
  currentScene: Scene | null;
  currentHighlight: string | null;
  skinOverride: "second-brand" | null;
  start: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  goTo: (i: number) => void;
};

const PresentationContext = createContext<Ctx | null>(null);

const OFFER_KEY = "dgn-vision-offers-v1";
const SNAPSHOT_KEY = "dgn-vision-offers-snapshot-v1";

/** Snapshot do localStorage de ofertas antes de iniciar a apresentação. */
function snapshotOffersAndReset() {
  if (typeof window === "undefined") return;
  const current = window.localStorage.getItem(OFFER_KEY);
  if (current != null) {
    window.sessionStorage.setItem(SNAPSHOT_KEY, current);
  } else {
    window.sessionStorage.removeItem(SNAPSHOT_KEY);
  }
  window.localStorage.removeItem(OFFER_KEY);
  window.dispatchEvent(new CustomEvent("dgn-offers-changed"));
}

/** Restaura o snapshot salvo em sessionStorage. */
function restoreOffersSnapshot() {
  if (typeof window === "undefined") return;
  const snap = window.sessionStorage.getItem(SNAPSHOT_KEY);
  if (snap != null) {
    window.localStorage.setItem(OFFER_KEY, snap);
    window.sessionStorage.removeItem(SNAPSHOT_KEY);
  } else {
    window.localStorage.removeItem(OFFER_KEY);
  }
  window.dispatchEvent(new CustomEvent("dgn-offers-changed"));
}

export function usePresentation() {
  const ctx = useContext(PresentationContext);
  if (!ctx) throw new Error("usePresentation must be used inside provider");
  return ctx;
}

export function PresentationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const totalSteps = SCENES.length;
  const didInitFromUrl = useRef(false);

  // Permite abrir via URL ?present=1[&step=n] + validação de consistência
  useEffect(() => {
    if (didInitFromUrl.current) return;
    didInitFromUrl.current = true;
    if (search?.get("present") === "1") {
      const s = Number(search.get("step") ?? 0);
      const target = Number.isFinite(s)
        ? Math.min(Math.max(s, 0), totalSteps - 1)
        : 0;
      snapshotOffersAndReset();
      setActive(true);
      setStepIndex(target);
    }
    if (process.env.NODE_ENV !== "production") {
      const issues = assertDataConsistency();
      if (issues.length) {
        console.warn("[DGN Vision] Inconsistências de dados:", issues);
      } else {
        console.info("[DGN Vision] Dados demonstrativos consistentes ✓");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navegação reativa — reage a mudança de stepIndex, nunca durante o updater
  useEffect(() => {
    if (!active) return;
    const scene = SCENES[stepIndex];
    if (!scene) return;
    const current = window.location.pathname + window.location.search;
    if (current !== scene.route) {
      router.push(scene.route);
    }
  }, [active, stepIndex, router]);

  // Scroll into view do highlight ao mudar de cena, com offset para o painel narrativo
  useEffect(() => {
    if (!active) return;
    const scene = SCENES[stepIndex];
    if (!scene?.highlight) return;
    // Aguarda router.push + render antes de scrollar
    const t = setTimeout(() => {
      const el = document.querySelector(`[data-highlight="${scene.highlight}"]`);
      if (el instanceof HTMLElement) {
        const rect = el.getBoundingClientRect();
        const offset = window.innerHeight * 0.2; // 20% do viewport pra respirar
        const target = window.scrollY + rect.top - offset;
        window.scrollTo({ top: Math.max(target, 0), behavior: "smooth" });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [active, stepIndex]);

  const start = useCallback(() => {
    snapshotOffersAndReset();
    setStepIndex(0);
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    setActive(false);
    restoreOffersSnapshot();
    const url = new URL(window.location.href);
    url.searchParams.delete("present");
    url.searchParams.delete("step");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const next = useCallback(
    () => setStepIndex((i) => Math.min(i + 1, totalSteps - 1)),
    [totalSteps]
  );
  const prev = useCallback(
    () => setStepIndex((i) => Math.max(i - 1, 0)),
    []
  );
  const goTo = useCallback(
    (i: number) =>
      setStepIndex(() => Math.min(Math.max(i, 0), totalSteps - 1)),
    [totalSteps]
  );

  // Esc encerra, setas/Space navegam
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        stop();
      } else if (
        e.key === "ArrowRight" ||
        e.key === " " ||
        e.key === "PageDown"
      ) {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, next, prev, stop]);

  const currentScene = active ? SCENES[stepIndex] ?? null : null;
  const currentHighlight = currentScene?.highlight ?? null;
  const skinOverride = currentScene?.skinOverride ?? null;

  const value = useMemo<Ctx>(
    () => ({
      active,
      stepIndex,
      totalSteps,
      currentScene,
      currentHighlight,
      skinOverride,
      start,
      stop,
      next,
      prev,
      goTo,
    }),
    [active, stepIndex, totalSteps, currentScene, currentHighlight, skinOverride, start, stop, next, prev, goTo]
  );

  return (
    <PresentationContext.Provider value={value}>
      {children}
    </PresentationContext.Provider>
  );
}

/**
 * Marca um elemento como alvo de destaque numa cena específica.
 * Quando a cena atual tem highlight === id, o elemento recebe um ring dourado.
 */
export function PresentationHighlight({
  id,
  className = "",
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = useContext(PresentationContext);
  const isActive = ctx?.currentHighlight === id;
  return (
    <div
      data-highlight={id}
      className={
        className +
        " transition-all duration-500 " +
        (isActive
          ? "ring-2 ring-gold-400/70 ring-offset-4 ring-offset-ink-950 rounded-2xl shadow-gold"
          : "")
      }
    >
      {children}
    </div>
  );
}
