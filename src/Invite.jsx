import { useState, useEffect } from "react";
import { useRouter } from "./router";

export default function Invite() {
  const { path } = useRouter();
  const code   = new URLSearchParams(window.location.search).get("code") || "";
  const [email,   setEmail]   = useState("");
  const [status,  setStatus]  = useState("idle"); // idle | loading | sent | error
  const [msg,     setMsg]     = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/invite", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim(), code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
        setMsg(data.error || "Código de convite inválido.");
      }
    } catch {
      setStatus("error");
      setMsg("Erro de conexão. Tente novamente.");
    }
  }

  if (!code) {
    return (
      <div style={wrap}>
        <p style={{ color: "#ef4444", fontSize: 14 }}>Link de convite inválido.</p>
      </div>
    );
  }

  if (status === "sent") {
    return (
      <div style={wrap}>
        <div style={card}>
          <Logo />
          <p style={label}>Acesso liberado</p>
          <h1 style={title}>Verifique seu email.</h1>
          <p style={sub}>
            Enviamos um link de acesso para <strong style={{ color: "#dddde0" }}>{email}</strong>.
            Clique no link para entrar — ele expira em 1 hora.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <Logo />
        <p style={label}>Convite exclusivo · beta</p>
        <h1 style={title}>Você foi convidado para o MotorIA Pro.</h1>
        <p style={sub}>Digite seu email para receber o link de acesso.</p>

        <form onSubmit={handleSubmit} style={{ marginTop: 28 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            disabled={status === "loading"}
            style={input}
          />
          <button type="submit" disabled={status === "loading"} style={btn}>
            {status === "loading" ? "Enviando…" : "Receber acesso →"}
          </button>
        </form>

        {status === "error" && (
          <p style={{ marginTop: 16, fontSize: 13, color: "#ef4444" }}>{msg}</p>
        )}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
      <div style={{ width: 28, height: 28, background: "#22c55e", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: "#050507" }}>M</span>
      </div>
      <span style={{ fontSize: 14, fontWeight: 800, color: "#dddde0" }}>MotorIA <span style={{ color: "#22c55e" }}>Pro</span></span>
    </div>
  );
}

const wrap  = { minHeight: "100vh", background: "#060608", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "Inter, sans-serif" };
const card  = { width: "100%", maxWidth: 420, background: "#0b0b0f", border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: "40px 36px" };
const label = { margin: "0 0 10px", fontSize: 10, fontWeight: 800, letterSpacing: ".16em", color: "#22c55e", textTransform: "uppercase" };
const title = { margin: "0 0 14px", fontSize: 22, fontWeight: 900, color: "#dddde0", lineHeight: 1.2, letterSpacing: "-.02em" };
const sub   = { margin: 0, fontSize: 14, color: "#72727a", lineHeight: 1.7 };
const input = { display: "block", width: "100%", boxSizing: "border-box", background: "#111115", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "13px 14px", fontSize: 14, color: "#dddde0", outline: "none", marginBottom: 10 };
const btn   = { display: "block", width: "100%", background: "#22c55e", color: "#050507", fontSize: 13, fontWeight: 900, letterSpacing: ".06em", border: "none", borderRadius: 8, padding: "14px 0", cursor: "pointer", textTransform: "uppercase" };
