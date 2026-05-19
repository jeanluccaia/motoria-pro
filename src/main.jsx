import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Router, useRouter } from "./router";
import { GLOBAL_CSS } from "./Layout";
import { AuthProvider } from "./contexts/AuthContext";

// ── GLOBAL FETCH SANITIZER — strips non-ISO-8859-1 chars from ALL headers ──
// Prevents "String contains non ISO-8859-1 code point" browser error
// regardless of source (Supabase SDK, env vars with BOM, third-party libs).
(function patchFetch() {
  const orig = window.fetch;

  // Strip any char with code point > 255 (non-ISO-8859-1)
  function san(v) { return String(v ?? "").replace(/[^\x00-\xFF]/g, "").trim(); }

  function sanitizeHeaders(raw) {
    if (!raw) return raw;
    if (raw instanceof Headers) {
      const h = new Headers();
      for (const [k, v] of raw.entries()) { const sk = san(k); if (sk) h.set(sk, san(v)); }
      return h;
    }
    if (Array.isArray(raw)) {
      return raw.map(([k, v]) => [san(k), san(v)]).filter(([k]) => k);
    }
    const h = {};
    for (const [k, v] of Object.entries(raw)) { const sk = san(k); if (sk) h[sk] = san(v); }
    return h;
  }

  window.fetch = function safeFetch(input, init) {
    if (init?.headers) {
      init = { ...init, headers: sanitizeHeaders(init.headers) };
    }
    return orig.call(this, input, init);
  };
})();

const Landing      = lazy(() => import("./Landing"));
const Tool         = lazy(() => import("./Tool"));
const AppDashboard = lazy(() => import("./AppDashboard"));
const Analisar     = lazy(() => import("./Analisar"));
const Obrigado     = lazy(() => import("./Obrigado"));
const AppMembro    = lazy(() => import("./AppMembro"));
const Login        = lazy(() => import("./Login"));
const AuthCallback = lazy(() => import("./AuthCallback"));
const PaywallPage  = lazy(() => import("./PaywallPage"));
const Multipla     = lazy(() => import("./Multipla"));

function App() {
  const { path } = useRouter();

  if (path === "/login")              return <Login />;
  if (path === "/auth/callback")      return <AuthCallback />;
  if (path === "/paywall")            return <PaywallPage />;
  if (path === "/ferramenta")         return <Tool />;          // legado — mantido
  if (path === "/app")                return <AppDashboard />;
  if (path === "/analisar")           return <Analisar />;
  if (path === "/multipla")           return <Multipla />;
  if (path === "/obrigado")           return <Obrigado />;
  if (path === "/membro")             return <AppMembro />;
  if (path === "/pagar") {
    window.location.replace("https://pay.kiwify.com.br/DIVD8zl");
    return null;
  }
  return <Landing />;
}

createRoot(document.getElementById("root")).render(
  <Suspense fallback={<div style={{ minHeight: "100vh", background: "#050505" }} />}>
    <style>{GLOBAL_CSS}</style>
    <AuthProvider>
      <Router>
        <App />
      </Router>
    </AuthProvider>
  </Suspense>
);
