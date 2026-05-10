import React from "react";
import { createRoot } from "react-dom/client";
import { Router, useRouter } from "./router";
import { GLOBAL_CSS } from "./Layout";
import Landing    from "./Landing";
import Analisar   from "./Analisar";
import Obrigado   from "./Obrigado";
import AppMembro  from "./AppMembro";

function App() {
  const { path } = useRouter();

  if (path === "/analisar")  return <Analisar />;
  if (path === "/obrigado")  return <Obrigado />;
  if (path === "/app")       return <AppMembro />;
  if (path === "/pagar") {
    // Redireciona para checkout externo — substitua pela URL real
    window.location.replace("https://pay.kiwify.com.br/SUBSTITUA_AQUI");
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
