import React from "react";
import { createRoot } from "react-dom/client";
import { Router, useRouter } from "./router";
import { GLOBAL_CSS } from "./Layout";
import Tool       from "./Tool";
import Landing    from "./Landing";
import Analisar   from "./Analisar";
import Obrigado   from "./Obrigado";
import AppMembro  from "./AppMembro";

function App() {
  const { path } = useRouter();

  if (path === "/")            return <Landing />;
  if (path === "/ferramenta")  return <Tool />;
  if (path === "/venda")       return <Landing />;
  if (path === "/analisar")  return <Analisar />;
  if (path === "/obrigado")  return <Obrigado />;
  if (path === "/app")       return <AppMembro />;
  if (path === "/pagar") {
    window.location.replace("https://pay.kiwify.com.br/DIVD8zl");
    return null;
  }
  return <Landing />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <style>{GLOBAL_CSS}</style>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
