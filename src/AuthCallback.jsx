import { useEffect, useRef, useState } from "react";
import { supabase, getIsPaid } from "./lib/supabase";

const ACCESS_KEY = "motoria_access_v1";

async function syncAndCheckPaid(session) {
  const jwt = session.access_token;

  // 1. Server sync: handles TESTER_EMAILS + Redis + upsert is_paid
  try {
    const res = await fetch("/api/auth/sync-paid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.is_paid === true) return true;
      console.warn("[auth-callback] sync-paid returned is_paid=false");
    } else {
      console.warn("[auth-callback] sync-paid HTTP", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("[auth-callback] sync-paid fetch error:", err.message);
  }

  // 2. Fallback: read profiles.is_paid directly (user reads own row via RLS)
  try {
    const paid = await getIsPaid(session.user.id);
    if (paid) {
      console.log("[auth-callback] access confirmed via profiles fallback");
      return true;
    }
  } catch (err) {
    console.error("[auth-callback] profiles fallback error:", err.message);
  }

  return false;
}

export default function AuthCallback() {
  const [status, setStatus] = useState("Autenticando…");
  const handled = useRef(false);

  useEffect(() => {
    async function handleSession(session) {
      if (!session || handled.current) return;
      handled.current = true;

      setStatus("Verificando acesso…");
      try {
        const paid = await syncAndCheckPaid(session);
        if (paid) {
          localStorage.setItem(ACCESS_KEY, "1");
          setStatus("Acesso confirmado! Redirecionando…");
          console.log("redirect reason:", "auth-callback-paid", { to: "/app" });
          setTimeout(() => window.location.replace("/app"), 400);
        } else {
          setStatus("Redirecionando…");
          console.log("redirect reason:", "auth-callback-unpaid-check-app", { to: "/app" });
          setTimeout(() => window.location.replace("/app"), 400);
        }
      } catch {
        // On unexpected error, grant access to avoid locking out valid users
        localStorage.setItem(ACCESS_KEY, "1");
        console.log("redirect reason:", "auth-callback-error-grant", { to: "/app" });
        setTimeout(() => window.location.replace("/app"), 400);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => { await handleSession(session); }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await handleSession(session);
    });

    const timeout = setTimeout(() => {
      if (!handled.current) {
        setStatus("Não foi possível autenticar. Verifique seu link.");
      }
    }, 10000);

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
