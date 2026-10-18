import type { Metadata } from "next";
import { Suspense } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { PresentationProvider } from "@/components/presentation/PresentationProvider";
import { PresentationOverlay } from "@/components/presentation/PresentationOverlay";

export const metadata: Metadata = {
  title: "DGN Vision · Preview Executivo",
  description:
    "Demonstração executiva da plataforma DGN — operação automotiva estruturada e tecnologia replicável.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-ink-950 bg-grain font-sans antialiased">
        <Suspense fallback={null}>
          <PresentationProvider>
            <AppShell>{children}</AppShell>
            <PresentationOverlay />
          </PresentationProvider>
        </Suspense>
      </body>
    </html>
  );
}
