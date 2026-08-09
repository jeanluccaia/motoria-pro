import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Vercel injecta VERCEL_PROJECT_PRODUCTION_URL em prod e VERCEL_URL em preview.
// Localmente cai no http://localhost:3000 — só afeta o build local, sem impacto
// no compartilhamento real. Não usamos NEXT_PUBLIC_APP_URL porque o loudflow
// hoje deriva a origem em runtime (mesma URL que o browser abriu).
const metadataBaseUrl = new URL(
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000",
);

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl,
  title: {
    default: "Loud Flow | Loud Fit",
    template: "%s · Loud Flow | Loud Fit",
  },
  description: "Gestão de resultados e tarefas da Loud Fit",
  applicationName: "Loud Flow",
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: "Loud Flow · Loud Fit",
    title: "Loud Flow | Loud Fit",
    description: "Gestão de resultados e tarefas da Loud Fit",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Loud Flow | Loud Fit",
    description: "Gestão de resultados e tarefas da Loud Fit",
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
