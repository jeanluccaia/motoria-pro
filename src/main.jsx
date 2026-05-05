import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import MotorIAPro from "./MotorIAPro";
import RiskAnalysis from "./RiskAnalysis";

function App() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (hash === "#risk") return <RiskAnalysis />;
  return <MotorIAPro />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
