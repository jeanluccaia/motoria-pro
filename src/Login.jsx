import { useEffect, useState } from "react";
import { useAuth } from "./contexts/AuthContext";

export default function Login() {
  const { session, isPaid, authLoading, sendMagicLink } = useAuth();
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!authLoading && session) {
      window.location.replace(isPaid ? "/app" : "/paywall");
    }
  }, [session, isPaid, authLoading]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      await sendMagicLink(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(err?.message || "Erro ao enviar. Tente novamente.");
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
          <h1 className="lg-title">MotorIA Pro</h1>

          {sent ? (
            <>
              <div className="lg-sent-icon">✉</div>
              <p className="lg-sent-title">Link enviado!</p>
              <p className="lg-sub">
                Verifique <strong>{email}</strong> e clique no link para entrar.
                <br />O link expira em 1 hora.
              </p>
              <button className="lg-resend" onClick={() => setSent(false)}>
                Usar outro email
              </button>
            </>
          ) : (
            <>
              <p className="lg-sub">
                Digite seu email para receber um link de acesso — sem senha,
                sem burocracia.
              </p>
              <form className="lg-form" onSubmit={handleSubmit}>
                <input
                  className="lg-input"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
                {error && <p className="lg-error">{error}</p>}
                <button className="lg-btn" type="submit" disabled={loading}>
                  {loading ? "Enviando…" : "Enviar link de acesso"}
                </button>
              </form>
              <p className="lg-price-note">
                R$27 uma vez só · acesso imediato · sem mensalidade
              </p>
            </>
          )}
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
  max-width: 360px;
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
  font-size: 22px;
  font-weight: 900;
  color: #F2F2F0;
  margin: 0 0 10px;
  letter-spacing: -0.02em;
}
.lg-sub {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.65;
  margin: 0 0 28px;
  max-width: 290px;
}
.lg-sub strong { color: #F2F2F0; }
.lg-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}
.lg-input {
  width: 100%;
  padding: 14px 16px;
  background: #141416;
  border: 1px solid #2A2A2E;
  border-radius: 12px;
  color: #F2F2F0;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.lg-input:focus { border-color: #1FCB7A; }
.lg-input::placeholder { color: #444; }
.lg-btn {
  width: 100%;
  padding: 15px;
  background: #1FCB7A;
  color: #000;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
}
.lg-btn:hover:not(:disabled) { opacity: 0.88; }
.lg-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.lg-error {
  font-size: 13px;
  color: #FF4D2E;
  margin: 0;
}
.lg-price-note {
  font-size: 12px;
  color: #3A3A3E;
  margin: 0;
}
.lg-sent-icon {
  font-size: 40px;
  margin-bottom: 12px;
}
.lg-sent-title {
  font-size: 18px;
  font-weight: 700;
  color: #1FCB7A;
  margin: 0 0 10px;
}
.lg-resend {
  margin-top: 20px;
  background: none;
  border: 1px solid #2A2A2E;
  color: #6B7280;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 13px;
  cursor: pointer;
}
.lg-resend:hover { border-color: #444; color: #F2F2F0; }
`;
