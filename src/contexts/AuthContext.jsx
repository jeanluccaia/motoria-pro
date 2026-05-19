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
    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Erro ao enviar link de acesso.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setIsPaid(false);
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
