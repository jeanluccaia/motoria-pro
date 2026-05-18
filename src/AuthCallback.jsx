import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function AuthCallback() {
  const [status, setStatus] = useState("Autenticando…");

  useEffect(() => {
    // Magic link: Supabase processa o hash automaticamente.
    // Aguarda onAuthStateChange confirmar a sessão.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setStatus("Acesso confirmado! Redirecionando…");
          setTimeout(() => {
            window.location.replace("/app");
          }, 600);
        }
      }
    );

    // Fallback: sessão já existia antes do evento disparar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus("Acesso confirmado! Redirecionando…");
        setTimeout(() => window.location.replace("/app"), 600);
      }
    });

    // Timeout de segurança
    const timeout = setTimeout(() => {
      setStatus("Não foi possível autenticar. Verifique seu link.");
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const isError = status.includes("Não foi possível");

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0B",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      fontFamily: "Inter, sans-serif",
    }}>
      {!isError && (
        <div style={{
          width: 36, height: 36,
          border: "3px solid #1FCB7A",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
      )}
      <p style={{ color: isError ? "#FF4D2E" : "#6B7280", fontSize: 14, margin: 0 }}>
        {status}
      </p>
      {isError && (
        <a href="/login" style={{
          marginTop: 8,
          color: "#1FCB7A",
          fontSize: 14,
          textDecoration: "none",
        }}>
          Voltar ao login
        </a>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
