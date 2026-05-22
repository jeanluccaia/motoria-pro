import { useState, useEffect } from "react";
import { useNavigate } from "./router";
import { buildSafeHeaders } from "./utils/safeHeaders";

// Must match the constant in sw.js
const SHARE_CACHE      = "motoria-share-v1";
const CODE_SESSION_KEY = "motoria_code_session";
const ADMIN_BYPASS_KEY = "MOTORIA_OWNER_KEY_2026";

// ─── Auth helpers (same pattern as ImportarBilhete) ──────────────────────────

function getCodeSession() {
  try { return JSON.parse(localStorage.getItem(CODE_SESSION_KEY) || "null"); }
  catch { return null; }
}

function buildAuthHeaders() {
  const adminKey = localStorage.getItem("motoria_admin_key");
  const token    = getCodeSession()?.sessionToken || "";
  if (adminKey === ADMIN_BYPASS_KEY) {
    return buildSafeHeaders({ "Content-Type": "application/json", "x-admin-key": ADMIN_BYPASS_KEY });
  }
  return buildSafeHeaders({
    "Content-Type": "application/json",
    ...(token ? { "x-motoria-code-session": token } : {}),
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function scoreColor(score) {
  if (score <= 35) return "#1FCB7A";
  if (score <= 60) return "#F59E0B";
  if (score <= 80) return "#F97316";
  return "#EF4444";
}

function alertBorderColor(tipo) {
  if (tipo === "danger") return "#EF4444";
  if (tipo === "warn")   return "#F59E0B";
  return "#374151";
}

function alertTextColor(tipo) {
  if (tipo === "danger") return "#FCA5A5";
  if (tipo === "warn")   return "#FCD34D";
  return "#9CA3AF";
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
.st-page {
  min-height: 100vh;
  background: #0A0A0B;
  color: #F2F2F0;
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  display: flex;
  flex-direction: column;
}
.st-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 24px;
  border-bottom: 1px solid #161618;
  position: sticky; top: 0; z-index: 50;
  background: rgba(10,10,11,0.97);
  backdrop-filter: blur(14px);
}
.st-hdr-logo {
  font-family: 'Syne', sans-serif;
  font-size: 14px; font-weight: 900;
  color: #F2F2F0; letter-spacing: -0.02em;
}
.st-hdr-tag {
  font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
  color: #1FCB7A; background: rgba(31,203,122,0.1);
  border: 1px solid rgba(31,203,122,0.18);
  padding: 3px 9px; border-radius: 20px;
}
.st-hdr-back {
  display: flex; align-items: center; gap: 3px;
  font-size: 13px; font-weight: 600; color: #4B5563;
  background: none; border: none; cursor: pointer;
  padding: 8px 0; transition: color 0.15s;
}
.st-hdr-back:hover { color: #D1D5DB; }

.st-body {
  flex: 1;
  max-width: 540px; margin: 0 auto;
  padding: 40px 24px 80px;
  width: 100%;
}

/* ── Loading / spinner ─────────── */
.st-center {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 60vh; gap: 16px; color: #6B7280; text-align: center;
}
.st-spinner {
  width: 32px; height: 32px;
  border: 2px solid #1C1C1E;
  border-top-color: #1FCB7A;
  border-radius: 50%;
  animation: st-spin 0.8s linear infinite;
}
@keyframes st-spin { to { transform: rotate(360deg); } }

/* ── Typography ────────────────── */
.st-badge {
  font-size: 11px; font-weight: 700; letter-spacing: 0.07em;
  color: #1FCB7A; background: rgba(31,203,122,0.08);
  border: 1px solid rgba(31,203,122,0.15);
  padding: 4px 10px; border-radius: 20px;
  display: inline-block; margin-bottom: 16px;
}
.st-title {
  font-family: 'Syne', sans-serif;
  font-size: 26px; font-weight: 900;
  letter-spacing: -0.03em; line-height: 1.2;
  margin-bottom: 8px;
}
.st-sub {
  font-size: 15px; color: #6B7280; margin-bottom: 28px; line-height: 1.65;
}

/* ── Image preview ─────────────── */
.st-preview {
  width: 100%; border-radius: 14px; overflow: hidden;
  border: 1px solid #1C1C1E; margin-bottom: 24px;
}
.st-preview img {
  width: 100%; display: block;
  max-height: 360px; object-fit: contain;
  background: #0D0D0F;
}
.st-preview-foot {
  padding: 11px 14px;
  display: flex; align-items: center; justify-content: space-between;
  background: #0D0D0F;
  border-top: 1px solid #1C1C1E;
  font-size: 12px; color: #4B5563;
}

/* ── Text share box ─────────────── */
.st-text-label {
  font-size: 11px; color: #4B5563; font-weight: 600;
  letter-spacing: 0.06em; text-transform: uppercase;
  margin-bottom: 8px;
}
.st-text-box {
  background: #0D0D0F; border: 1px solid #1C1C1E;
  border-radius: 14px; padding: 16px;
  font-size: 14px; color: #D1D5DB;
  line-height: 1.7; white-space: pre-wrap;
  margin-bottom: 24px;
  max-height: 280px; overflow-y: auto;
}

/* ── Progress bar ──────────────── */
.st-progress-wrap {
  width: 100%; max-width: 320px;
  height: 3px; background: #1C1C1E;
  border-radius: 99px; overflow: hidden;
  margin-bottom: 10px;
}
.st-progress-bar {
  height: 100%; background: #1FCB7A;
  border-radius: 99px; transition: width 0.6s ease;
}

/* ── Buttons ───────────────────── */
.st-btn-primary {
  display: block; width: 100%;
  background: #1FCB7A; color: #050505;
  font-size: 15px; font-weight: 800;
  padding: 16px; border-radius: 12px; border: none;
  cursor: pointer; transition: opacity 0.15s;
  margin-bottom: 12px;
}
.st-btn-primary:hover { opacity: 0.9; }
.st-btn-secondary {
  display: block; width: 100%;
  background: none; color: #6B7280;
  font-size: 14px; font-weight: 600;
  padding: 12px; border-radius: 12px;
  border: 1px solid #1C1C1E;
  cursor: pointer; transition: color 0.15s, border-color 0.15s;
  margin-bottom: 12px;
}
.st-btn-secondary:hover { color: #D1D5DB; border-color: #374151; }

/* ── Score ─────────────────────── */
.st-score-wrap {
  background: #0D0D0F; border: 1px solid #1C1C1E;
  border-radius: 18px; padding: 28px 24px;
  text-align: center; margin-bottom: 20px;
}
.st-score-num {
  font-family: 'Syne', sans-serif;
  font-size: 80px; font-weight: 900; line-height: 1;
  margin-bottom: 4px;
}
.st-score-label {
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.12em; margin-bottom: 4px;
}
.st-veredicto { font-size: 13px; color: #6B7280; }

/* ── Summary text ──────────────── */
.st-analise {
  font-size: 14px; color: #9CA3AF; line-height: 1.7;
  background: #0D0D0F; border: 1px solid #1C1C1E;
  border-radius: 14px; padding: 16px;
  margin-bottom: 20px;
}

/* ── Alerts ────────────────────── */
.st-alerts { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
.st-alert {
  padding: 12px 14px;
  border-radius: 10px;
  border-left: 3px solid #374151;
  background: rgba(255,255,255,0.02);
  font-size: 13px; line-height: 1.55;
}

/* ── Empty / error ─────────────── */
.st-empty { text-align: center; padding: 60px 0; }
.st-empty-ico { font-size: 40px; margin-bottom: 16px; }
.st-empty-title {
  font-family: 'Syne', sans-serif;
  font-size: 20px; font-weight: 800; margin-bottom: 10px;
}
.st-empty-msg {
  font-size: 14px; color: #6B7280;
  line-height: 1.65; margin-bottom: 28px;
}

@media (max-width: 600px) {
  .st-title { font-size: 22px; }
  .st-body  { padding: 32px 18px 72px; }
}
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ShareTarget() {
  const navigate = useNavigate();

  // phase: loading | confirm-image | confirm-text | analyzing | result | error | empty
  const [phase,      setPhase]      = useState("loading");
  const [sharedMeta, setSharedMeta] = useState(null);
  const [imageFile,  setImageFile]  = useState(null);
  const [imageUrl,   setImageUrl]   = useState(null);
  const [loadPct,    setLoadPct]    = useState(0);
  const [resultado,  setResultado]  = useState(null);
  const [error,      setError]      = useState("");

  useEffect(() => {
    readSharedData();
    return () => { if (imageUrl) URL.revokeObjectURL(imageUrl); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Read payload stored by the Service Worker ──────────────────
  async function readSharedData() {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("shared");

    if (!shared || !("caches" in window)) {
      setPhase("empty");
      return;
    }

    try {
      const cache   = await caches.open(SHARE_CACHE);
      const metaRes = await cache.match("/share-target-meta");

      if (!metaRes) {
        setPhase("empty");
        return;
      }

      const meta = await metaRes.json();
      setSharedMeta(meta);

      if (meta.type === "image") {
        const imgRes = await cache.match("/share-target-image");
        if (imgRes) {
          const blob = await imgRes.blob();
          const file = new File([blob], meta.name || "bilhete.jpg", {
            type: meta.mime || "image/jpeg",
          });
          setImageFile(file);
          setImageUrl(URL.createObjectURL(blob));
        }
        setPhase("confirm-image");
      } else {
        setPhase("confirm-text");
      }

      // Clean up cache entries after reading — data consumed
      await cache.delete("/share-target-meta");
      await cache.delete("/share-target-image");
    } catch {
      setPhase("empty");
    }
  }

  // ── Send image to the analysis API ────────────────────────────
  async function handleAnalyze() {
    if (!imageFile) return;
    setPhase("analyzing");
    setLoadPct(0);

    // Animate progress
    const ticks = [12, 32, 52, 72, 90];
    const timers = ticks.map((pct, i) =>
      setTimeout(() => setLoadPct(pct), i * 950)
    );

    try {
      const base64 = await fileToBase64(imageFile);
      const resp = await fetch("/api/scan-bilhete", {
        method:  "POST",
        headers: buildAuthHeaders(),
        body:    JSON.stringify({ imageBase64: base64, mimeType: imageFile.type || "image/jpeg" }),
      });
      const data = await resp.json();

      timers.forEach(clearTimeout);

      if (!resp.ok || !data.ok) throw new Error(data.error || "Falha ao processar bilhete.");

      setLoadPct(100);
      setTimeout(() => {
        setResultado(data.analise);
        setPhase("result");
      }, 300);
    } catch (err) {
      timers.forEach(clearTimeout);
      setError(err.message || "Erro ao analisar bilhete.");
      setPhase("error");
    }
  }

  // ── Derived ───────────────────────────────────────────────────
  const scoreNum = resultado ? Math.min(100, Math.max(0, Number(resultado.scoreRisco))) : 0;
  const sc       = resultado ? scoreColor(scoreNum) : "#1FCB7A";

  const sharedText = sharedMeta
    ? [sharedMeta.title, sharedMeta.text, sharedMeta.url].filter(Boolean).join("\n\n")
    : "";

  return (
    <div className="st-page">
      <style>{CSS}</style>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="st-hdr">
        <button className="st-hdr-back" onClick={() => navigate("/importar")}>
          ‹ Voltar
        </button>
        <span className="st-hdr-logo">MotorIA Pro</span>
        <span className="st-hdr-tag">COMPARTILHADO</span>
      </header>

      <div className="st-body">

        {/* ── Loading: reading cache ─────────────────────────────── */}
        {phase === "loading" && (
          <div className="st-center">
            <div className="st-spinner" />
            <span>Lendo bilhete compartilhado…</span>
          </div>
        )}

        {/* ── Confirm: image received ─────────────────────────────── */}
        {phase === "confirm-image" && (
          <>
            <div className="st-badge">BILHETE RECEBIDO</div>
            <h1 className="st-title">Bilhete recebido</h1>
            <p className="st-sub">Deseja analisar este bilhete agora?</p>

            {imageUrl && (
              <div className="st-preview">
                <img src={imageUrl} alt="Print do bilhete compartilhado" />
                <div className="st-preview-foot">
                  <span>{imageFile?.name || "bilhete.jpg"}</span>
                  <span>
                    {imageFile
                      ? `${(imageFile.size / 1024 / 1024).toFixed(1)} MB`
                      : ""}
                  </span>
                </div>
              </div>
            )}

            <button className="st-btn-primary" onClick={handleAnalyze}>
              Analisar Bilhete
            </button>
            <button className="st-btn-secondary" onClick={() => navigate("/importar")}>
              Cancelar — usar upload manual
            </button>
          </>
        )}

        {/* ── Confirm: text/URL received ──────────────────────────── */}
        {phase === "confirm-text" && (
          <>
            <div className="st-badge">TEXTO RECEBIDO</div>
            <h1 className="st-title">Texto compartilhado</h1>
            <p className="st-sub">
              Recebemos o conteúdo do bilhete. Use as informações abaixo para
              preencher a análise manual.
            </p>

            {sharedText && (
              <>
                <p className="st-text-label">Conteúdo recebido</p>
                <div className="st-text-box">{sharedText}</div>
              </>
            )}

            <button
              className="st-btn-primary"
              onClick={() => navigate("/analisar")}
            >
              Abrir análise manual
            </button>
            <button
              className="st-btn-secondary"
              onClick={() => navigate("/importar")}
            >
              Prefiro enviar um print
            </button>
          </>
        )}

        {/* ── Analyzing ──────────────────────────────────────────── */}
        {phase === "analyzing" && (
          <div className="st-center">
            <div className="st-spinner" />
            <span style={{ marginBottom: 20 }}>Analisando bilhete…</span>
            <div className="st-progress-wrap">
              <div className="st-progress-bar" style={{ width: `${loadPct}%` }} />
            </div>
            <span style={{ fontSize: 13, color: "#4B5563" }}>{loadPct}%</span>
          </div>
        )}

        {/* ── Result ─────────────────────────────────────────────── */}
        {phase === "result" && resultado && (
          <>
            <div className="st-badge">ANÁLISE CONCLUÍDA</div>

            <div className="st-score-wrap">
              <div className="st-score-num" style={{ color: sc }}>
                {Math.round(scoreNum)}
              </div>
              <div className="st-score-label" style={{ color: sc }}>
                {resultado.scoreLabel || "—"}
              </div>
              <div className="st-veredicto">{resultado.veredicto || ""}</div>
            </div>

            {resultado.analise && (
              <div className="st-analise">{resultado.analise}</div>
            )}

            {Array.isArray(resultado.alertas) && resultado.alertas.length > 0 && (
              <div className="st-alerts">
                {resultado.alertas.map((a, i) => (
                  <div
                    key={i}
                    className="st-alert"
                    style={{
                      borderLeftColor: alertBorderColor(a.tipo),
                      color:           alertTextColor(a.tipo),
                    }}
                  >
                    {a.texto}
                  </div>
                ))}
              </div>
            )}

            <button className="st-btn-primary" onClick={() => navigate("/importar")}>
              Analisar outro bilhete
            </button>
            <button className="st-btn-secondary" onClick={() => navigate("/app")}>
              Ir para o Dashboard
            </button>
          </>
        )}

        {/* ── Error ──────────────────────────────────────────────── */}
        {phase === "error" && (
          <div className="st-empty">
            <div className="st-empty-ico">⚠️</div>
            <h2 className="st-empty-title">Erro na análise</h2>
            <p className="st-empty-msg">{error}</p>
            <button className="st-btn-primary" onClick={() => navigate("/importar")}>
              Tentar com upload manual
            </button>
          </div>
        )}

        {/* ── Empty: no shared data found ─────────────────────────── */}
        {phase === "empty" && (
          <div className="st-empty">
            <div className="st-empty-ico">📋</div>
            <h2 className="st-empty-title">Nenhum bilhete recebido</h2>
            <p className="st-empty-msg">
              Para usar esta funcionalidade, compartilhe o bilhete direto do app
              da sua casa de aposta e selecione MotorIA Pro como destino.
              O MotorIA precisa estar instalado como app no celular.
            </p>
            <button className="st-btn-primary" onClick={() => navigate("/importar")}>
              Usar upload de imagem
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
