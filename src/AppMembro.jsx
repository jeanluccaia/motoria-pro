import { useEffect } from "react";
import { LegalBar, Header, Footer } from "./Layout";
import { Link, useNavigate } from "./router";

const ACCESS_KEY = "motoria_access_v1";

function hasAccess() {
  return localStorage.getItem(ACCESS_KEY) === "1";
}

export default function AppMembro() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasAccess()) navigate("/");
  }, []);

  if (!hasAccess()) return null;

  return (
    <>
      <LegalBar />
      <Header />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px" }}>
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 26,
            fontWeight: 800,
            color: "#fff",
            marginBottom: 8,
          }}
        >
          Área do Membro
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 36 }}>
          Bem-vindo. Você tem acesso ilimitado à análise de risco.
        </p>

        <Link
          to="/analisar"
          style={{
            display: "block",
            background: "#F2F2F0",
            color: "#0A0A0B",
            fontWeight: 700,
            fontSize: 15,
            padding: "16px 24px",
            borderRadius: 10,
            textDecoration: "none",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          Analisar nova aposta →
        </Link>

        <div
          style={{
            background: "#111112",
            border: "1px solid #1E1E1F",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#444",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Em breve
          </p>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "Histórico completo das suas análises",
              "Diário de apostas com resultado real",
              "Gráfico de resultado real vs esperado",
              "Alerta de stop-loss mensal",
              "Glossário: o que a casa não te conta (40 termos)",
              "Comparador de odds entre casas",
            ].map((item, i) => (
              <li key={i} style={{ fontSize: 14, color: "#555", display: "flex", gap: 10 }}>
                <span style={{ color: "#2a2a2b" }}>○</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Footer />
    </>
  );
}
