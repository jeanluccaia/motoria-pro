import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

const ACCESS_KEY = "motoria_access_v1";

async function syncAndCheckPaid(session) {
  try {
    const jwt = session.access_token;
    const res = await fetch("/api/auth/sync-paid", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${jwt}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return data.is_paid === true;
    }
  } catch (err) {
    console.error("[auth-callback] sync-paid error:", err.message);
  }
  return false;
}

export default function AuthCallback() {
  const [status, setStatus] = useState("Autenticando…");

  useEffect(() => {
    async function handleSession(session) {
      if (!session) return;
      setStatus("Verificando acesso…");
      try {
        const paid = await syncAndCheckPaid(session);
        if (paid) {
          localStorage.setItem(ACCESS_KEY, "1");
          setStatus("Acesso confirmado! Redirecionando…");
          setTimeout(() => window.location.replace("/app"), 600);
        } else {
          setStatus("Redirecionando…");
          setTimeout(() => window.location.replace("/paywall"), 600);
        }
      } catch {
        setTimeout(() => window.location.replace("/app"), 600);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => { await handleSession(session); }
    );

    // Fallback: session may already exist before the event fires
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await handleSession(session);
    });

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
        <a href="/login" style={{ marginTop: 8, color: "#1FCB7A", fontSize: 14, textDecoration: "none" }}>
          Voltar ao login
        </a>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
