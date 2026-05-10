import { useEffect } from "react";
import { LegalBar, Header, Footer } from "./Layout";
import { Link } from "./router";

const ACCESS_KEY = "motoria_access_v1";

export default function Obrigado() {
  useEffect(() => {
    localStorage.setItem(ACCESS_KEY, "1");
  }, []);

  return (
    <>
      <LegalBar />
      <Header />
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 20 }}>✅</div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 14 }}>
          Acesso liberado!
        </h1>
        <p style={{ fontSize: 16, color: "#6B7280", lineHeight: 1.7, marginBottom: 32 }}>
          Bem-vindo ao MotorIA Pro. Você agora tem análises ilimitadas.
          Use a ferramenta antes de cada aposta — seu bolso agradece.
        </p>
        <Link
          to="/analisar"
          style={{
            display: "inline-block",
            background: "#F2F2F0",
            color: "#0A0A0B",
            fontSize: 15,
            fontWeight: 700,
            padding: "15px 28px",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Fazer minha primeira análise →
        </Link>
        <p style={{ fontSize: 12, color: "#333", marginTop: 24 }}>
          Dúvidas? Entre em contato pelo email do recibo de pagamento.
        </p>
      </div>
      <Footer />
    </>
  );
}
