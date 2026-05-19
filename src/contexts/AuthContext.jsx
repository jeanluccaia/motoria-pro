import { createContext, useContext, useEffect, useState } from "react";
import { supabase, getIsPaid } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session,     setSession]     = useState(null);
  const [isPaid,      setIsPaid]      = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) setIsPaid(await getIsPaid(session.user.id));
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setIsPaid(session ? await getIsPaid(session.user.id) : false);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  async function sendMagicLink(email) {
    // 1. Verificar autorização no servidor (TESTER_EMAILS / is_paid / Redis)
    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "Email não encontrado. Use o email da compra.");
    }

    if (data.sent) return; // Resend enviou — ok

    // 2. Fallback: Supabase OTP (não precisa de Resend)
    const redirectTo = window.location.origin + "/auth/callback";
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (otpErr) throw new Error("Erro ao enviar: " + otpErr.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setIsPaid(false);
    localStorage.removeItem("motoria_access_v1");
  }

  return (
    <AuthContext.Provider value={{ session, isPaid, authLoading, sendMagicLink, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
