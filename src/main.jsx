import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Router, useRouter } from "./router";
import { GLOBAL_CSS } from "./Layout";
import { AuthProvider } from "./contexts/AuthContext";

// ── FETCH DEBUG PATCH (TEMPORÁRIO — remover após identificar o header inválido) ──
(function patchFetch() {
  const orig = window.fetch;
  window.fetch = async function debugFetch(input, init = {}) {
    try {
      if (init?.headers) {
        const entries =
          init.headers instanceof Headers
            ? Array.from(init.headers.entries())
            : Array.isArray(init.headers)
              ? init.headers
              : Object.entries(init.headers);

        for (const [key, value] of entries) {
          const k = String(key);
          const v = String(value ?? "");
          const badKey   = [...k].filter(ch => ch.charCodeAt(0) > 127);
          const badValue = [...v].filter(ch => ch.charCodeAt(0) > 127);
          if (badKey.length || badValue.length) {
            console.error("🚨 BAD HEADER DETECTED", {
              url: String(input),
              header: k,
              value: v,
              badCharsInKey:   badKey.map(c => ({ char: c, code: c.charCodeAt(0) })),
              badCharsInValue: badValue.map(c => ({ char: c, code: c.charCodeAt(0) })),
              allValueCodes:   [...v].map(c => c.charCodeAt(0)),
            });
          }
        }
        console.log("✅ FETCH:", String(input).replace(/\?.*/, ""), "| headers:", Object.fromEntries(
          entries.map(([k, v]) => [k, String(v).slice(0, 40)])
        ));
      }
      return orig.call(this, input, init);
    } catch (err) {
      console.error("🚨 FETCH THREW:", { url: String(input), error: err.message, init });
      throw err;
    }
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
