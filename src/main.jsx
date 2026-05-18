import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Router, useRouter } from "./router";
import { GLOBAL_CSS } from "./Layout";
import { AuthProvider } from "./contexts/AuthContext";

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
