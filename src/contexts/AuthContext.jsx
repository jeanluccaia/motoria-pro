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
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
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
