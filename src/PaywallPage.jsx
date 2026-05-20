import { useAuth } from "./contexts/AuthContext";
import { useEffect, useState } from "react";
import { getIsPaid } from "./lib/supabase";

const KIWIFY_URL = "https://pay.kiwify.com.br/DIVD8zl";
const ACCESS_KEY = "motoria_access_v1";

const FEATURES = [
  "Análise de risco por entrada (odd, margem, EV, Kelly)",
  "Análise de múltiplas — risco combinado do bilhete",
  "Controle de banca com histórico completo",
  "ROI, taxa de acerto e sequência de perdas",
  "Simulação de 30 e 90 dias",
  "Acesso imediato · sem mensalidade",
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

        {/* Glow de fundo */}
        <div className="pw-bg-glow" aria-hidden="true" />

        <div className="pw-box">

          {/* Lock */}
          <div className="pw-lock-wrap">
            <svg className="pw-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          {/* Hierarquia textual */}
          <p className="pw-eyebrow">Acesso Premium</p>
          <h1 className="pw-title">Acesso bloqueado</h1>
          <p className="pw-sub">
            Desbloqueie análise completa, múltiplas<br className="pw-br" /> e controle de banca.
          </p>

          {/* Preço */}
          <div className="pw-price-block">
            <span className="pw-old">R$47</span>
            <div className="pw-price">R$27</div>
            <p className="pw-price-note">pagamento único</p>
          </div>

          {/* CTA */}
          <a href={KIWIFY_URL} target="_blank" rel="noopener noreferrer" className="pw-btn">
            Desbloquear acesso agora
          </a>
          <p className="pw-microcopy">Pagamento único · sem mensalidade · acesso imediato</p>

          {/* Benefícios */}
          <ul className="pw-features">
            {FEATURES.map((f) => (
              <li key={f} className="pw-feature">
                <span className="pw-check" aria-hidden="true">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="6.5" cy="6.5" r="6.5" fill="#1FCB7A" fillOpacity=".15"/>
                    <path d="M3.5 6.5l2 2 4-4" stroke="#1FCB7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          {/* Garantia */}
          <div className="pw-guarantee">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1FCB7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>7 dias de garantia — não gostou, devolvo 100%</span>
          </div>

          {/* Já paguei */}
          <div className="pw-divider" />
          <p className="pw-already">Já realizou o pagamento?</p>
          <button className="pw-verify-btn" onClick={verificarAcesso} disabled={checking}>
            {checking ? "Verificando…" : "Confirmar meu acesso"}
          </button>
          {checkMsg && <p className="pw-check-msg">{checkMsg}</p>}

        </div>
      </div>
    </>
  );
}

const CSS = `
@keyframes pw-fade-up {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pw-glow-breathe {
  0%, 100% { box-shadow: 0 0 28px 0 rgba(31,203,122,.28); }
  50%       { box-shadow: 0 0 44px 4px rgba(31,203,122,.42); }
}

.pw-root {
  min-height: 100vh;
  min-height: 100dvh;
  background: #060608;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px 48px;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  position: relative;
  overflow: hidden;
}

/* Glow radial de fundo — muito sutil */
.pw-bg-glow {
  position: absolute;
  top: -10%;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(ellipse at center, rgba(31,203,122,.06) 0%, transparent 68%);
  pointer-events: none;
  z-index: 0;
}

.pw-box {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 390px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: pw-fade-up .55s cubic-bezier(.22,.68,0,1.2) both;
}

/* Lock icon */
.pw-lock-wrap {
  width: 56px;
  height: 56px;
  background: rgba(31,203,122,.1);
  border: 1px solid rgba(31,203,122,.2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
}
.pw-lock-icon {
  width: 24px;
  height: 24px;
  color: #1FCB7A;
}

/* Texto */
.pw-eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .18em;
  color: #1FCB7A;
  text-transform: uppercase;
  margin: 0 0 12px;
}
.pw-title {
  font-size: 28px;
  font-weight: 900;
  color: #F2F2F0;
  margin: 0 0 14px;
  letter-spacing: -.025em;
  line-height: 1.1;
}
.pw-sub {
  font-size: 15px;
  color: #72727A;
  line-height: 1.65;
  margin: 0 0 36px;
  max-width: 280px;
}
.pw-br { display: block; }

/* Preço */
.pw-price-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 32px;
}
.pw-old {
  font-size: 14px;
  color: #444448;
  text-decoration: line-through;
  text-decoration-color: rgba(68,68,72,.8);
  letter-spacing: .01em;
}
.pw-price {
  font-size: 72px;
  font-weight: 900;
  color: #1FCB7A;
  letter-spacing: -.04em;
  line-height: 1;
}
.pw-price-note {
  font-size: 11px;
  color: #444448;
  text-transform: uppercase;
  letter-spacing: .12em;
  margin: 2px 0 0;
}

/* CTA */
.pw-btn {
  display: block;
  width: 100%;
  padding: 18px 24px;
  background: #1FCB7A;
  color: #060608;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: .02em;
  border-radius: 14px;
  text-decoration: none;
  box-sizing: border-box;
  animation: pw-glow-breathe 3s ease-in-out infinite;
  transition: transform .15s, opacity .15s;
}
.pw-btn:hover {
  opacity: .92;
  transform: translateY(-1px);
}
.pw-btn:active { transform: scale(.98); }

.pw-microcopy {
  font-size: 11px;
  color: #38383E;
  margin: 10px 0 36px;
  letter-spacing: .01em;
}

/* Benefícios */
.pw-features {
  list-style: none;
  padding: 0;
  margin: 0 0 32px;
  width: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pw-feature {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13.5px;
  color: #9CA3AF;
  line-height: 1.5;
}
.pw-check {
  flex-shrink: 0;
  margin-top: 1px;
}

/* Garantia */
.pw-guarantee {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: #4B4B52;
  line-height: 1.6;
  margin-bottom: 32px;
  text-align: left;
  max-width: 280px;
}

/* Divider */
.pw-divider {
  width: 100%;
  height: 1px;
  background: rgba(255,255,255,.05);
  margin-bottom: 28px;
}

/* Já paguei */
.pw-already {
  font-size: 12px;
  color: #38383E;
  margin: 0 0 12px;
  letter-spacing: .02em;
}
.pw-verify-btn {
  width: 100%;
  padding: 14px;
  background: transparent;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px;
  color: #4B4B52;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: border-color .2s, color .2s;
  box-sizing: border-box;
}
.pw-verify-btn:hover:not(:disabled) {
  border-color: rgba(31,203,122,.35);
  color: #1FCB7A;
}
.pw-verify-btn:disabled { opacity: .4; cursor: not-allowed; }
.pw-check-msg {
  font-size: 12px;
  color: #F59E0B;
  margin-top: 12px;
  line-height: 1.55;
}

@media (max-width: 400px) {
  .pw-price { font-size: 60px; }
  .pw-title { font-size: 24px; }
  .pw-btn   { font-size: 14px; padding: 17px; }
}
`;
