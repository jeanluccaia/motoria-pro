import { useAuth } from "./contexts/AuthContext";
import { useEffect, useState } from "react";
import { getIsPaid } from "./lib/supabase";

const KIWIFY_URL = "https://pay.kiwify.com.br/DIVD8zl";
const ACCESS_KEY = "motoria_access_v1";

const FEATURES = [
  "Análise de risco por entrada",
  "Análise de múltiplas",
  "Controle de banca no mês",
  "Histórico de entradas",
  "ROI e sequência de perdas",
  "Acesso imediato",
];

export default function PaywallPage() {
  const { session, isPaid, authLoading } = useAuth();
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState("");

  useEffect(() => {
    if (!authLoading && !session) window.location.replace("/login");
    if (!authLoading && session && isPaid) window.location.replace("/app");
  }, [session, isPaid, authLoading]);

  async function verificarAcesso() {
    if (!session?.user?.id) return;
    setChecking(true);
    setCheckMsg("");
    try {
      const paid = await getIsPaid(session.user.id);
      if (paid) {
        localStorage.setItem(ACCESS_KEY, "1");
        window.location.replace("/app");
      } else {
        setCheckMsg("Pagamento ainda não confirmado. Aguarde alguns segundos e tente novamente.");
      }
    } catch {
      setCheckMsg("Erro ao verificar. Tente novamente.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="pw-root">
        <div className="pw-glow-bg" aria-hidden="true" />

        <div className="pw-box">
          <div className="pw-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          <p className="pw-badge">Acesso Premium</p>
          <h1 className="pw-title">Acesso bloqueado</h1>
          <p className="pw-subtitle">
            Desbloqueie análise completa,<br />múltiplas e controle de banca.
          </p>

          <div className="pw-price-wrap">
            <span className="pw-was">R$47</span>
            <div className="pw-now">R$27</div>
            <p className="pw-once">pagamento único</p>
          </div>

          <a href={KIWIFY_URL} target="_blank" rel="noopener noreferrer" className="pw-cta">
            Desbloquear acesso agora
          </a>
          <p className="pw-micro">Pagamento único · sem mensalidade</p>

          <ul className="pw-list">
            {FEATURES.map((f) => (
              <li key={f} className="pw-item">
                <span className="pw-item-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="9" fill="#1FCB7A" fillOpacity=".12"/>
                    <path d="M5.5 9l2.5 2.5 5-5" stroke="#1FCB7A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className="pw-shield">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1FCB7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:2}}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>7 dias de garantia — não gostou, devolvo 100%</span>
          </div>

          <div className="pw-sep" />
          <p className="pw-paid-label">Já realizou o pagamento?</p>
          <button className="pw-paid-btn" onClick={verificarAcesso} disabled={checking}>
            {checking ? "Verificando…" : "Confirmar meu acesso"}
          </button>
          {checkMsg && <p className="pw-paid-msg">{checkMsg}</p>}
        </div>
      </div>
    </>
  );
}

const CSS = `
@keyframes pw-in {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pw-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(31,203,122,.35), 0 8px 32px rgba(31,203,122,.18); }
  50%       { box-shadow: 0 0 0 6px rgba(31,203,122,.0), 0 8px 44px rgba(31,203,122,.3); }
}

* { box-sizing: border-box; }

.pw-root {
  min-height: 100vh;
  min-height: 100dvh;
  background: #07080A;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 24px 64px;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  position: relative;
  overflow: hidden;
}

.pw-glow-bg {
  position: fixed;
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  width: 700px;
  height: 500px;
  background: radial-gradient(ellipse at 50% 0%, rgba(31,203,122,.07) 0%, transparent 65%);
  pointer-events: none;
  z-index: 0;
}

.pw-box {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: pw-in .5s cubic-bezier(.22,.68,0,1.1) both;
}

.pw-icon {
  width: 60px;
  height: 60px;
  background: rgba(31,203,122,.1);
  border: 1.5px solid rgba(31,203,122,.22);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  flex-shrink: 0;
}
.pw-icon svg { color: #1FCB7A; }

.pw-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: #1FCB7A;
  margin: 0 0 14px;
}

.pw-title {
  font-size: 30px;
  font-weight: 900;
  color: #EFEFED;
  letter-spacing: -.03em;
  line-height: 1.1;
  margin: 0 0 12px;
}

.pw-subtitle {
  font-size: 15px;
  color: #686870;
  line-height: 1.7;
  margin: 0 0 40px;
  max-width: 270px;
}

.pw-price-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 36px;
  gap: 0;
}
.pw-was {
  font-size: 15px;
  color: #3A3A40;
  text-decoration: line-through;
  text-decoration-color: #3A3A40;
  margin-bottom: 4px;
}
.pw-now {
  font-size: 80px;
  font-weight: 900;
  color: #1FCB7A;
  letter-spacing: -.05em;
  line-height: .95;
}
.pw-once {
  font-size: 11px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: #3A3A40;
  margin-top: 8px;
}

.pw-cta {
  display: block;
  width: 100%;
  padding: 20px 24px;
  background: #1FCB7A;
  color: #050608;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: .025em;
  border-radius: 16px;
  text-decoration: none;
  animation: pw-pulse 2.8s ease-in-out infinite;
  transition: transform .15s, filter .15s;
  margin-bottom: 12px;
}
.pw-cta:hover  { filter: brightness(1.07); transform: translateY(-2px); }
.pw-cta:active { transform: scale(.98); }

.pw-micro {
  font-size: 11px;
  color: #333338;
  margin: 0 0 40px;
  letter-spacing: .01em;
}

.pw-list {
  list-style: none;
  padding: 0;
  margin: 0 0 36px;
  width: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.pw-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #8A8A94;
  line-height: 1.45;
}
.pw-item-icon { flex-shrink: 0; }

.pw-shield {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12.5px;
  color: #3E3E48;
  line-height: 1.65;
  margin-bottom: 36px;
  text-align: left;
  max-width: 290px;
}

.pw-sep {
  width: 100%;
  height: 1px;
  background: rgba(255,255,255,.045);
  margin-bottom: 28px;
}

.pw-paid-label {
  font-size: 12px;
  color: #333338;
  margin: 0 0 12px;
}
.pw-paid-btn {
  width: 100%;
  padding: 15px;
  background: transparent;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 13px;
  color: #444450;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: border-color .2s, color .2s;
}
.pw-paid-btn:hover:not(:disabled) { border-color: rgba(31,203,122,.3); color: #1FCB7A; }
.pw-paid-btn:disabled { opacity: .35; cursor: not-allowed; }
.pw-paid-msg {
  font-size: 12px;
  color: #D97706;
  margin-top: 12px;
  line-height: 1.6;
}

@media (max-width: 390px) {
  .pw-now   { font-size: 68px; }
  .pw-title { font-size: 26px; }
  .pw-cta   { font-size: 14px; padding: 18px; }
  .pw-root  { padding: 36px 20px 52px; }
}
`;
