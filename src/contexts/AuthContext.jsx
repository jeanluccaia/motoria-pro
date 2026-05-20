import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase, getIsPaid } from "../lib/supabase";

const AuthContext = createContext(null);

const IS_LOCAL = typeof window !== "undefined" && window.location.hostname === "localhost";
const CODE_SESSION_KEY = "motoria_code_session";

const LOCAL_SESSION = IS_LOCAL
  ? {
      user: { id: "local-dev", email: "dev@localhost" },
      access_token: "local-dev-bypass",
    }
  : null;

function getValidCodeSession() {
  try {
    const raw = localStorage.getItem(CODE_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed?.expiresAt && Date.now() < parsed.expiresAt) return parsed;

    localStorage.removeItem(CODE_SESSION_KEY);
  } catch {
    localStorage.removeItem(CODE_SESSION_KEY);
  }
  return null;
}

function buildCodeAuthSession(session) {
  if (!session?.user?.id) return null;
  return {
    user: {
      id: session.user.id,
      email: session.email || session.user.email,
    },
    access_token: session.sessionToken || "",
    isCodeSession: true,
  };
}

export function AuthProvider({ children }) {
  const initialCodeSession = IS_LOCAL ? null : getValidCodeSession();
  const codeSessionRef = useRef(initialCodeSession);
  const [codeSession, setCodeSession] = useState(initialCodeSession);
  const [session, setSession] = useState(LOCAL_SESSION || buildCodeAuthSession(initialCodeSession));
  const [isPaid, setIsPaid] = useState(IS_LOCAL || Boolean(initialCodeSession));
  const [authLoading, setAuthLoading] = useState(!IS_LOCAL && !initialCodeSession);

  const hasCodeSession = Boolean(codeSession);

  async function resolvePaid(supabaseSession) {
    if (!supabaseSession) return false;
    if (localStorage.getItem("motoria_access_v1") === "1") return true;
    return getIsPaid(supabaseSession.user.id);
  }

  useEffect(() => {
    if (IS_LOCAL) {
      localStorage.setItem("motoria_access_v1", "1");
      setAuthLoading(false);
      return undefined;
    }

    if (codeSessionRef.current) {
      setSession(buildCodeAuthSession(codeSessionRef.current));
      setIsPaid(true);
      setAuthLoading(false);
    }

    supabase.auth.getSession().then(async ({ data: { session: supabaseSession } }) => {
      if (codeSessionRef.current && !supabaseSession) {
        setSession(buildCodeAuthSession(codeSessionRef.current));
        setIsPaid(true);
        setAuthLoading(false);
        return;
      }

      setSession(supabaseSession);
      setIsPaid(supabaseSession ? await resolvePaid(supabaseSession) : false);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, supabaseSession) => {
        if (codeSessionRef.current && !supabaseSession) {
          setSession(buildCodeAuthSession(codeSessionRef.current));
          setIsPaid(true);
          setAuthLoading(false);
          return;
        }

        setSession(supabaseSession);
        if (supabaseSession) {
          setIsPaid(await resolvePaid(supabaseSession));
        } else {
          setIsPaid(false);
          localStorage.removeItem("motoria_access_v1");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithCode(email, code) {
    const res = await fetch("/api/auth/code-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || "Codigo invalido.");
      err.status = res.status;
      err.code = data.code;
      throw err;
    }

    localStorage.setItem(CODE_SESSION_KEY, JSON.stringify(data));
    localStorage.setItem("motoria_access_v1", "1");
    codeSessionRef.current = data;
    setCodeSession(data);
    setSession(buildCodeAuthSession(data));
    setIsPaid(true);
    setAuthLoading(false);

    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    codeSessionRef.current = null;
    setCodeSession(null);
    setSession(null);
    setIsPaid(false);
    localStorage.removeItem("motoria_access_v1");
    localStorage.removeItem(CODE_SESSION_KEY);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        isPaid,
        authLoading,
        codeSession,
        hasCodeSession,
        hasAccess: IS_LOCAL || isPaid || hasCodeSession,
        signInWithCode,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
