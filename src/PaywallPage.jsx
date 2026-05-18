import { useAuth } from "./contexts/AuthContext";
import { useNavigate } from "./router";
import { useEffect } from "react";

const KIWIFY_URL = "https://pay.kiwify.com.br/DIVD8zl";

const FEATURES = [
  "Análise de risco por aposta (odd, margem, EV, Kelly)",
  "Análise de múltiplas — risco combinado do bilhete",
  "Controle de banca persistente em qualquer dispositivo",
  "Histórico completo de entradas e resultados",
  "Simulação de 30 e 90 dias",
  "Pagamento único · sem mensalidade",
];

export default function PaywallPage() {
  const { session, isPaid, authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !session) navigate("/login");
    if (!authLoading && session && isPaid) navigate("/app");
  }, [session, isPaid, authLoading]);

  return (
    <>
      <style>{CSS}</style>
      <div className="pw-root">
        <div className="pw-box">
          <div className="pw-lock">🔒</div>

          <h1 className="pw-title">Acesso bloqueado</h1>
          <p className="pw-sub">
            Desbloqueie a análise completa, banca e múltiplas por R$27 — uma
            vez só.
          </p>

          <div className="pw-price-row">
            <span className="pw-old">R$47</span>
            <span className="pw-price">R$27</span>
          </div>

          <a href={KIWIFY_URL} target="_blank" rel="noopener noreferrer" className="pw-btn">
            Desbloquear acesso agora →
          </a>

          <ul className="pw-features">
            {FEATURES.map((f) => (
              <li key={f} className="pw-feature">
                <span className="pw-check">✓</span> {f}
              </li>
            ))}
          </ul>

          <p className="pw-guarantee">🛡 7 dias de garantia. Não gostou? Devolvo 100%.</p>
        </div>
      </div>
    </>
  );
}

const CSS = `
.pw-root {
  min-height: 100vh;
  background: #0A0A0B;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.pw-box {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.pw-lock { font-size: 44px; margin-bottom: 16px; }
.pw-title {
  font-family: 'Syne', sans-serif;
  font-size: 24px;
  font-weight: 900;
  color: #F2F2F0;
  margin-bottom: 10px;
  letter-spacing: -0.02em;
}
.pw-sub {
  font-size: 15px;
  color: #6B7280;
  line-height: 1.65;
  margin-bottom: 24px;
  max-width: 300px;
}
.pw-price-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 20px;
}
.pw-old { font-size: 16px; color: #444; text-decoration: line-through; }
.pw-price { font-size: 40px; font-weight: 900; color: #1FCB7A; font-family: 'Syne', sans-serif; }
.pw-btn {
  display: block;
  width: 100%;
  padding: 17px;
  background: #1FCB7A;
  color: #000;
  font-size: 16px;
  font-weight: 900;
  border-radius: 12px;
  text-decoration: none;
  margin-bottom: 24px;
  transition: opacity 0.15s;
}
.pw-btn:hover { opacity: 0.9; }
.pw-features {
  list-style: none;
  padding: 0;
  width: 100%;
  text-align: left;
  margin-bottom: 20px;
}
.pw-feature {
  font-size: 13px;
  color: #9CA3AF;
  padding: 5px 0;
  display: flex;
  gap: 8px;
}
.pw-check { color: #1FCB7A; flex-shrink: 0; }
.pw-guarantee { font-size: 12px; color: #555; }
`;
