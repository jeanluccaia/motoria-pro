"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SCENES } from "./scenes";

type Ctx = {
  active: boolean;
  stepIndex: number;
  totalSteps: number;
  start: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  goTo: (i: number) => void;
};

const PresentationContext = createContext<Ctx | null>(null);

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

  // Permite abrir via URL ?present=1[&step=n]
  useEffect(() => {
    if (search.get("present") === "1") {
      const s = Number(search.get("step") ?? 0);
      setActive(true);
      setStepIndex(Number.isFinite(s) ? Math.min(Math.max(s, 0), totalSteps - 1) : 0);
    }
  }, [search, totalSteps]);

  const applyScene = useCallback(
    (i: number) => {
      const scene = SCENES[i];
      if (!scene) return;
      // navega apenas se mudou a rota base
      const current = window.location.pathname + window.location.search;
      if (current !== scene.route) {
        router.push(scene.route);
      }
    },
    [router]
  );

  const start = useCallback(() => {
    setActive(true);
    setStepIndex(0);
    applyScene(0);
  }, [applyScene]);

  const stop = useCallback(() => {
    setActive(false);
    // Limpa querystring da cena de oferta/confirmação
    const url = new URL(window.location.href);
    url.searchParams.delete("present");
    url.searchParams.delete("step");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const next = useCallback(() => {
    setStepIndex((i) => {
      const n = Math.min(i + 1, totalSteps - 1);
      applyScene(n);
      return n;
    });
  }, [applyScene, totalSteps]);

  const prev = useCallback(() => {
    setStepIndex((i) => {
      const n = Math.max(i - 1, 0);
      applyScene(n);
      return n;
    });
  }, [applyScene]);

  const goTo = useCallback(
    (i: number) => {
      const n = Math.min(Math.max(i, 0), totalSteps - 1);
      setStepIndex(n);
      applyScene(n);
    },
    [applyScene, totalSteps]
  );

  // Atalhos de teclado
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        stop();
      } else if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
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

  const value = useMemo<Ctx>(
    () => ({ active, stepIndex, totalSteps, start, stop, next, prev, goTo }),
    [active, stepIndex, totalSteps, start, stop, next, prev, goTo]
  );

  return (
    <PresentationContext.Provider value={value}>
      {children}
    </PresentationContext.Provider>
  );
}
