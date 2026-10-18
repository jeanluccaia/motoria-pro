"use client";

import { usePresentation } from "./PresentationProvider";
import { IconArrow } from "@/components/Icons";

export function StartPresentationButton({
  variant = "primary",
}: {
  variant?: "primary" | "ghost";
}) {
  const { start } = usePresentation();
  return (
    <button
      onClick={start}
      className={variant === "primary" ? "btn-primary" : "btn-ghost"}
    >
      Iniciar apresentação <IconArrow size={14} />
    </button>
  );
}
