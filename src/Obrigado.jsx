import { useEffect, useState } from "react";
import { LegalBar, Header, Footer } from "./Layout";
import { supabase, getIsPaid } from "./lib/supabase";

const ACCESS_KEY  = "motoria_access_v1";
const MAX_POLLS   = 12;   // 12 × 3s = 36 segundos esperando webhook
const POLL_DELAY  = 3000;

export default function Obrigado() {
  const [phase, setPhase] = useState("checking"); // "checking" | "granted" | "waiting" | "manual"

  useEffect(() => {
    let polls = 0;
    let timer;

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Não está logado — fallback: grant via localStorage (usuários que pagaram sem login)
        localStorage.setItem(ACCESS_KEY, "1");
        setPhase("granted");
        return;
      }

      const paid = await getIsPaid(session.user.id).catch(() => false);

      if (paid) {
        localStorage.setItem(ACCESS_KEY, "1");
        setPhase("granted");
        return;
      }

      polls++;
      if (polls >= MAX_POLLS) {
        // Webhook ainda não chegou — grant via localStorage e mostra aviso
        localStorage.setItem(ACCESS_KEY, "1");
        setPhase("manual");
        return;
      }

      // Ainda não confirmado — tentar de novo
      setPhase("waiting");
      timer = setTimeout(check, POLL_DELAY);
    }

    check();
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <LegalBar />
      <Header />
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "64px 24px", textAlign: "center", fontFamily: "Inter, sans-serif" }}>

        {(phase === "checking" || phase === "waiting") && (
          <>
            <div style={{
              width: 44, height: 44, margin: "0 auto 24px",
              border: "3px solid #1FCB7A", borderTopColor: "transparent",
              borderRadius: "50%", animation: "spin 0.8s linear infinite",
            }} />
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 900, color: "#F2F2F0", marginBottom: 10 }}>
              Confirmando pagamento…
            </h1>
            <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>
              Isso leva alguns segundos. Não feche esta página.
            </p>
          </>
        )}

        {phase === "granted" && (
          <>
            <div style={{ fontSize: 52, marginBottom: 20 }}>✅</div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 900, color: "#F2F2F0", marginBottom: 14 }}>
              Acesso liberado!
            </h1>
            <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, marginBottom: 32 }}>
              Bem-vindo ao MotorIA Pro. Análises ilimitadas, banca e múltiplas.
              Use antes de cada aposta — seu bolso agradece.
            </p>
            <a
              href="/app"
              style={{
                display: "inline-block",
                background: "#1FCB7A",
                color: "#000",
                fontSize: 15,
                fontWeight: 900,
                padding: "16px 32px",
                borderRadius: 12,
                textDecoration: "none",
              }}
            >
              Acessar o MotorIA →
            </a>
          </>
        )}

        {phase === "manual" && (
          <>
            <div style={{ fontSize: 52, marginBottom: 20 }}>✅</div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 900, color: "#F2F2F0", marginBottom: 14 }}>
              Pagamento recebido!
            </h1>
            <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, marginBottom: 8 }}>
              Seu acesso foi liberado neste dispositivo. Se usar outro dispositivo,
              basta fazer login com o mesmo email.
            </p>
            <a
              href="/app"
              style={{
                display: "inline-block",
                background: "#1FCB7A",
                color: "#000",
                fontSize: 15,
                fontWeight: 900,
                padding: "16px 32px",
                borderRadius: 12,
                textDecoration: "none",
                marginTop: 24,
              }}
            >
              Acessar o MotorIA →
            </a>
          </>
        )}

        <p style={{ fontSize: 12, color: "#333", marginTop: 28 }}>
          Dúvidas? Entre em contato pelo email do recibo de pagamento.
        </p>
      </div>
      <Footer />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
