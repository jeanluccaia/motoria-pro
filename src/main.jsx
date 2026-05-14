import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Router, useRouter } from "./router";
import { GLOBAL_CSS } from "./Layout";

/*
  Route-level code splitting:
  Each page is its own chunk — landing visitors never download Tool/Analisar/etc.
  Tool visitors never download the full Landing CSS blob.
  The Suspense fallback is intentionally minimal (dark bg only, no spinner)
  so there is no visible flash or layout shift.
*/
const Landing   = lazy(() => import("./Landing"));
const Tool      = lazy(() => import("./Tool"));
const Analisar  = lazy(() => import("./Analisar"));
const Obrigado  = lazy(() => import("./Obrigado"));
const AppMembro = lazy(() => import("./AppMembro"));

function App() {
  const { path } = useRouter();

  if (path === "/ferramenta" || path === "/app") return <Tool />;
  if (path === "/analisar")   return <Analisar />;
  if (path === "/obrigado")   return <Obrigado />;
  if (path === "/app")        return <AppMembro />;
  if (path === "/pagar") {
    window.location.replace("https://pay.kiwify.com.br/DIVD8zl");
    return null;
  }
  return <Landing />;
}

createRoot(document.getElementById("root")).render(
  <Suspense fallback={<div style={{ minHeight: "100vh", background: "#050505" }} />}>
    <style>{GLOBAL_CSS}</style>
    <Router>
      <App />
    </Router>
  </Suspense>
);
