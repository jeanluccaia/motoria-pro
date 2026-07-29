"use client";

import { useEffect } from "react";
import type { FounderEvent } from "@/lib/founder-tracking";

export function trackFounderEvent(slug: string, event: FounderEvent) {
  if (new URLSearchParams(window.location.search).get("preview") === "1") return;
  const url = `/api/public/founders/${encodeURIComponent(slug)}/events`;
  const body = JSON.stringify({ event });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
  } else {
    void fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true });
  }
}

export function FounderPublicTracking({ slug }: { slug: string }) {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("preview") === "1") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (document.visibilityState !== "visible" || timer) return;
      timer = setTimeout(() => {
        if (document.visibilityState === "visible") trackFounderEvent(slug, "page_view");
      }, 1500);
    };
    schedule();
    document.addEventListener("visibilitychange", schedule);
    return () => { if (timer) clearTimeout(timer); document.removeEventListener("visibilitychange", schedule); };
  }, [slug]);
  return null;
}
