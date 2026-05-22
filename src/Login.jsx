import { useState } from "react";
import { useAuth } from "./contexts/AuthContext";

function normalizeCode(value) {
  return String(value || "").toUpperCase().replace(/[\s\u200B-\u200D\uFEFF]/g, "");
}

export default function Login() {
  const { signInWithCode } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const normEmail = email.trim().toLowerCase();
    const normCode = normalizeCode(code);
    if (!normEmail || !normCode) return;

    setLoading(true);
    setError("");
    try {
      await signInWithCode(normEmail, normCode);
      console.log("redirect reason:", "code-login-success", { to: "/app", email: normEmail });
      window.location.replace("/app");
    } catch (err) {
      setError(err?.message || "Codigo invalido ou expirado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="lg-root">
        <div className="lg-box">
          <div className="lg-mark">M</div>
          <h1 className="lg-title">Entrar no MotorIA Pro</h1>
          <p className="lg-sub">Use o email da compra e seu código de acesso.</p>

          <form className="lg-form" onSubmit={handleSubmit} noValidate>
            <label className="lg-field">
              <span>Seu email</span>
              <input
                className="lg-input"
                type="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                required
                autoFocus
                autoComplete="email"
              />
            </label>

            <label className="lg-field">
              <span>Código de acesso</span>
              <input
                className="lg-input lg-input-code"
                type="text"
                placeholder="JEAN2026"
                value={code}
                onChange={(e) => { setCode(normalizeCode(e.target.value)); setError(""); }}
                required
                autoComplete="off"
                spellCheck={false}
              />
            </label>

            {error && <p className="lg-error" role="alert">{error}</p>}

            <button className="lg-btn" type="submit" disabled={loading || !email.trim() || !code.trim()}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <a
            className="lg-buy"
            href="https://pay.kiwify.com.br/DIVD8zl"
            target="_blank"
            rel="noopener noreferrer"
          >
            Não tem código? Desbloquear por R$27
          </a>
        </div>
      </div>
    </>
  );
}

const CSS = `
.lg-root {
  min-height: 100vh;
  background: #0A0A0B;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: 'Inter', sans-serif;
}
.lg-box {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.lg-mark {
  width: 56px;
  height: 56px;
  background: #1FCB7A;
  color: #000;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 26px;
  margin-bottom: 20px;
}
.lg-title {
  font-family: 'Syne', sans-serif;
  font-size: 24px;
  font-weight: 900;
  color: #F2F2F0;
  margin: 0 0 10px;
  letter-spacing: 0;
}
.lg-sub {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.6;
  margin: 0 0 28px;
}
.lg-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 18px;
}
.lg-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  text-align: left;
}
.lg-field span {
  font-size: 12px;
  font-weight: 700;
  color: #7A7A82;
}
.lg-input {
  width: 100%;
  padding: 15px 16px;
  background: #141416;
  border: 1px solid #2A2A2E;
  border-radius: 12px;
  color: #F2F2F0;
  font-size: 16px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.lg-input:focus { border-color: #1FCB7A; }
.lg-input::placeholder { color: #444; }
.lg-input-code {
  text-transform: uppercase;
  letter-spacing: .08em;
  font-weight: 800;
}
.lg-error {
  font-size: 13px;
  color: #FF4D2E;
  background: rgba(255,77,46,.07);
  border: 1px solid rgba(255,77,46,.18);
  border-radius: 10px;
  padding: 10px 12px;
  margin: 0;
  text-align: left;
}
.lg-btn {
  width: 100%;
  padding: 15px;
  background: #1FCB7A;
  color: #000;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  transition: opacity 0.15s;
}
.lg-btn:hover:not(:disabled) { opacity: 0.88; }
.lg-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.lg-buy {
  color: #1FCB7A;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}
.lg-buy:hover { text-decoration: underline; text-underline-offset: 3px; }
`;
