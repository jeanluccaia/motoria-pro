import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "./router";
import { buildSafeHeaders } from "./utils/safeHeaders";

// ─── Constants ────────────────────────────────────────────────────────────────

const CODE_SESSION_KEY = "motoria_code_session";
const ADMIN_BYPASS_KEY = "MOTORIA_OWNER_KEY_2026";
const MAX_FILE_MB      = 3;

const LOAD_STEPS = [
  { label: "Escaneando bilhete",               pct: 12 },
  { label: "Identificando jogos e odds",        pct: 28 },
  { label: "Calculando variância da múltipla",  pct: 46 },
  { label: "Avaliando exposição ao risco",      pct: 63 },
  { label: "Gerando score proprietário",        pct: 80 },
  { label: "Compilando alertas inteligentes",   pct: 94 },
];

const STEP_DELAYS_MS = [0, 900, 1700, 2450, 3050, 3550];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCodeSession() {
  try { return JSON.parse(localStorage.getItem(CODE_SESSION_KEY) || "null"); }
  catch { return null; }
}

function buildAuthHeaders() {
  const adminKey        = localStorage.getItem("motoria_admin_key");
  const session         = getCodeSession();
  const codeSessionToken = session?.sessionToken || "";

  if (adminKey === ADMIN_BYPASS_KEY) {
    return buildSafeHeaders({
      "Content-Type":  "application/json",
      "x-admin-key":   ADMIN_BYPASS_KEY,
    });
  }
  return buildSafeHeaders({
    "Content-Type": "application/json",
    ...(codeSessionToken ? { "x-motoria-code-session": codeSessionToken } : {}),
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

function scoreBg(score) {
  if (score <= 35) return "rgba(31,203,122,0.09)";
  if (score <= 60) return "rgba(245,158,11,0.09)";
  if (score <= 80) return "rgba(249,115,22,0.09)";
  return "rgba(239,68,68,0.09)";
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

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconScan = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
    <rect x="4" y="4"   width="10" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="22" y="4"  width="10" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="4" y="22"  width="10" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M22 27h5m5 0h-5m0 0v-5m0 5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconCheck = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconLeft = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
.ib-page {
  min-height: 100vh;
  background: #0A0A0B;
  color: #F2F2F0;
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ── Header ─────────────────────────────────────────────── */
.ib-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 24px;
  border-bottom: 1px solid #161618;
  position: sticky; top: 0; z-index: 50;
  background: rgba(10,10,11,0.97);
  backdrop-filter: blur(14px);
}
.ib-hdr-back {
  display: flex; align-items: center; gap: 3px;
  font-size: 13px; font-weight: 600; color: #4B5563;
  background: none; border: none; cursor: pointer;
  padding: 8px 0; transition: color 0.15s;
}
.ib-hdr-back:hover { color: #D1D5DB; }
.ib-hdr-logo {
  font-family: 'Syne', sans-serif;
  font-size: 14px; font-weight: 900;
  color: #F2F2F0; letter-spacing: -0.02em;
}
.ib-hdr-tag {
  font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
  color: #1FCB7A; background: rgba(31,203,122,0.1);
  border: 1px solid rgba(31,203,122,0.18);
  padding: 3px 9px; border-radius: 20px;
}

/* ── Upload ─────────────────────────────────────────────── */
.ib-upload-wrap {
  max-width: 540px; margin: 0 auto;
  padding: 72px 24px 80px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
}
.ib-title {
  font-family: 'Syne', sans-serif;
  font-size: 34px; font-weight: 900;
  letter-spacing: -0.035em; line-height: 1.12;
  margin-bottom: 14px;
}
.ib-subtitle {
  font-size: 16px; color: #6B7280; line-height: 1.65;
  max-width: 360px; margin-bottom: 52px;
}
.ib-drop {
  width: 100%; position: relative;
  border: 1px solid #1C1C1E; border-radius: 18px;
  background: #0D0D0F;
  padding: 64px 32px;
  cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 18px;
  transition: border-color 0.2s, background 0.2s;
  outline: none;
}
.ib-drop:hover, .ib-drop:focus-visible {
  border-color: rgba(31,203,122,0.3);
  background: rgba(31,203,122,0.025);
}
.ib-drop.ib-drag { border-color: rgba(31,203,122,0.55); background: rgba(31,203,122,0.04); }
.ib-drop-ico {
  width: 68px; height: 68px; border-radius: 18px;
  background: #141416; border: 1px solid #222225;
  display: flex; align-items: center; justify-content: center;
  color: #3F3F46; transition: color 0.2s, border-color 0.2s;
}
.ib-drop:hover .ib-drop-ico, .ib-drop.ib-drag .ib-drop-ico {
  color: #1FCB7A; border-color: rgba(31,203,122,0.25);
}
.ib-drop-txt { font-size: 15px; font-weight: 600; color: #9CA3AF; }
.ib-drop-hint { font-size: 13px; color: #374151; margin-top: -10px; }
.ib-drop input[type="file"] {
  position: absolute; inset: 0; opacity: 0; cursor: pointer;
  width: 100%; height: 100%;
}
.ib-houses {
  display: flex; flex-wrap: wrap; justify-content: center;
  gap: 7px; margin-top: 28px;
}
.ib-house {
  font-size: 11px; font-weight: 600; color: #374151;
  background: #0F0F11; border: 1px solid #1C1C1E;
  padding: 4px 11px; border-radius: 20px; letter-spacing: 0.02em;
}

/* ── Preview ─────────────────────────────────────────────── */
.ib-preview-wrap {
  max-width: 540px; margin: 0 auto; padding: 40px 24px 80px;
}
.ib-preview-card {
  border: 1px solid #1C1C1E; border-radius: 18px; overflow: hidden;
  background: #0D0D0F; margin-bottom: 20px;
}
.ib-preview-img {
  width: 100%; max-height: 340px; object-fit: contain;
  background: #111113; display: block;
}
.ib-preview-foot {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-top: 1px solid #161618;
}
.ib-preview-name {
  font-size: 13px; font-weight: 600; color: #6B7280;
  max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ib-preview-size { font-size: 12px; color: #374151; }
.ib-btn-primary {
  width: 100%; background: #1FCB7A; color: #050505;
  font-size: 15px; font-weight: 900;
  padding: 18px 24px; border-radius: 14px; border: none;
  cursor: pointer; transition: opacity 0.15s, transform 0.1s;
  letter-spacing: -0.01em; margin-bottom: 10px;
}
.ib-btn-primary:hover  { opacity: 0.9; }
.ib-btn-primary:active { transform: scale(0.99); }
.ib-btn-secondary {
  width: 100%; background: transparent; color: #6B7280;
  font-size: 13px; font-weight: 600;
  padding: 13px 24px; border-radius: 12px;
  border: 1px solid #1C1C1E; cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.ib-btn-secondary:hover { color: #D1D5DB; border-color: #2D2D30; }

/* ── Loading ─────────────────────────────────────────────── */
.ib-loading-wrap {
  min-height: calc(100vh - 57px);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 48px 24px; max-width: 400px; margin: 0 auto;
}
.ib-loading-brand {
  font-family: 'Syne', sans-serif;
  font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
  color: #1FCB7A; text-transform: uppercase;
  display: flex; align-items: center; gap: 8px; margin-bottom: 48px;
}
.ib-pulse-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #1FCB7A;
  animation: ibPulse 1.1s ease-in-out infinite;
}
@keyframes ibPulse {
  0%,100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.35; transform: scale(0.7); }
}
.ib-ring-wrap {
  width: 100px; height: 100px; border-radius: 50%;
  border: 1.5px solid #1A1A1C;
  display: flex; align-items: center; justify-content: center;
  position: relative; margin-bottom: 44px;
}
.ib-ring {
  position: absolute; inset: 5px; border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: #1FCB7A;
  animation: ibSpin 1.1s linear infinite;
}
@keyframes ibSpin { to { transform: rotate(360deg); } }
.ib-ring-pct {
  font-family: 'Syne', sans-serif;
  font-size: 22px; font-weight: 900; color: #F2F2F0;
  position: relative; z-index: 1;
}
.ib-steps { width: 100%; display: flex; flex-direction: column; gap: 0; }
.ib-step {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 0; border-bottom: 1px solid #111113;
  opacity: 0; transform: translateY(5px);
  transition: opacity 0.28s ease, transform 0.28s ease;
}
.ib-step.vis  { opacity: 1; transform: translateY(0); }
.ib-step-ind {
  width: 22px; height: 22px; border-radius: 50%;
  background: #111113; border: 1px solid #222225; color: #3F3F46;
  font-size: 9px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  transition: background 0.25s, color 0.25s, border-color 0.25s;
}
.ib-step.done .ib-step-ind  { background: #1FCB7A; color: #050505; border-color: #1FCB7A; }
.ib-step.act  .ib-step-ind  {
  background: rgba(31,203,122,0.12); color: #1FCB7A;
  border-color: rgba(31,203,122,0.3);
  animation: ibPulse 1.1s ease-in-out infinite;
}
.ib-step-lbl { font-size: 13px; font-weight: 500; color: #4B5563; transition: color 0.2s; }
.ib-step.act .ib-step-lbl  { color: #E5E7EB; }
.ib-step.done .ib-step-lbl { color: #374151; }

/* ── Result ──────────────────────────────────────────────── */
.ib-result-wrap {
  max-width: 540px; margin: 0 auto; padding: 32px 24px 88px;
}

/* Hero score */
.ib-hero {
  position: relative; overflow: hidden;
  background: #0D0D0F; border: 1px solid #1C1C1E;
  border-radius: 22px; padding: 44px 32px 36px;
  text-align: center; margin-bottom: 14px;
}
.ib-hero-glow {
  position: absolute; top: -80px; left: 50%; transform: translateX(-50%);
  width: 260px; height: 260px; border-radius: 50%;
  filter: blur(70px); opacity: 0.1; pointer-events: none;
}
.ib-hero-sup {
  font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
  text-transform: uppercase; color: #374151; margin-bottom: 10px;
}
.ib-hero-num {
  font-family: 'Syne', sans-serif;
  font-size: 100px; font-weight: 900;
  line-height: 1; letter-spacing: -0.045em;
  margin-bottom: 0; position: relative; z-index: 1;
}
.ib-hero-den {
  font-family: 'Syne', sans-serif;
  font-size: 30px; font-weight: 700; opacity: 0.35;
}
.ib-hero-badge {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 7px 16px; border-radius: 20px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.07em;
  text-transform: uppercase; margin-top: 14px;
  position: relative; z-index: 1;
}
.ib-hero-dot { width: 6px; height: 6px; border-radius: 50%; }
.ib-bar-track {
  margin-top: 26px; height: 3px;
  background: #161618; border-radius: 2px; overflow: hidden;
}
.ib-bar-fill {
  height: 100%; border-radius: 2px;
  transition: width 1.1s cubic-bezier(0.4,0,0.2,1);
}

/* Stats */
.ib-stats {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;
}
.ib-stat {
  background: #0D0D0F; border: 1px solid #1C1C1E;
  border-radius: 16px; padding: 22px 20px;
}
.ib-stat-lbl {
  font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: #374151; margin-bottom: 8px;
}
.ib-stat-val {
  font-family: 'Syne', sans-serif;
  font-size: 30px; font-weight: 900;
  letter-spacing: -0.03em; line-height: 1; color: #F2F2F0;
}
.ib-stat-unit { font-size: 15px; font-weight: 600; opacity: 0.45; }

/* Section label */
.ib-sec-lbl {
  font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
  text-transform: uppercase; color: #374151;
  margin-bottom: 10px; margin-top: 6px;
}

/* Alertas */
.ib-alerts { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.ib-alert {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 16px; border-radius: 12px;
  border-left: 3px solid; background: rgba(255,255,255,0.02);
}
.ib-alert-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.ib-alert-txt { font-size: 13px; font-weight: 500; line-height: 1.55; }

/* Seleções */
.ib-sels { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.ib-sel {
  display: flex; align-items: center; gap: 12px;
  background: #0D0D0F; border: 1px solid #1C1C1E;
  border-radius: 13px; padding: 14px 16px;
}
.ib-sel-score {
  width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
}
.ib-sel-info { flex: 1; min-width: 0; }
.ib-sel-jogo {
  font-size: 13px; font-weight: 600; color: #E5E7EB;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;
}
.ib-sel-mkt { font-size: 11px; color: #4B5563; font-weight: 500; }
.ib-sel-odd {
  font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
  color: #9CA3AF; flex-shrink: 0;
}

/* Análise textual */
.ib-analise {
  background: #0D0D0F; border: 1px solid #1C1C1E;
  border-radius: 16px; padding: 20px 20px; margin-bottom: 20px;
}
.ib-analise-txt { font-size: 14px; color: #6B7280; line-height: 1.75; }

/* Novo bilhete */
.ib-btn-reset {
  width: 100%; background: transparent; color: #9CA3AF;
  font-size: 14px; font-weight: 700;
  padding: 17px 24px; border-radius: 14px;
  border: 1px solid #1C1C1E; cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.ib-btn-reset:hover {
  border-color: rgba(31,203,122,0.25);
  color: #F2F2F0; background: rgba(31,203,122,0.025);
}

/* ── Error ───────────────────────────────────────────────── */
.ib-err-wrap {
  min-height: calc(100vh - 57px);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 48px 24px; max-width: 400px; margin: 0 auto; text-align: center;
}
.ib-err-ico { font-size: 36px; margin-bottom: 20px; }
.ib-err-title {
  font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800;
  margin-bottom: 10px;
}
.ib-err-msg { font-size: 14px; color: #6B7280; line-height: 1.65; margin-bottom: 32px; }
.ib-btn-retry {
  background: #F2F2F0; color: #050505;
  font-size: 14px; font-weight: 800;
  padding: 14px 36px; border-radius: 12px; border: none;
  cursor: pointer; transition: opacity 0.15s;
}
.ib-btn-retry:hover { opacity: 0.88; }

/* ── Mobile ──────────────────────────────────────────────── */
@media (max-width: 600px) {
  .ib-title   { font-size: 27px; }
  .ib-hero-num { font-size: 76px; }
  .ib-stat-val  { font-size: 26px; }
  .ib-upload-wrap { padding: 48px 20px 60px; }
  .ib-result-wrap { padding: 24px 18px 72px; }
  .ib-drop    { padding: 52px 20px; }
}
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImportarBilhete() {
  const navigate = useNavigate();

  const [phase,      setPhase]      = useState("upload");
  const [imageFile,  setImageFile]  = useState(null);
  const [imageUrl,   setImageUrl]   = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadStep,   setLoadStep]   = useState(-1);
  const [loadPct,    setLoadPct]    = useState(0);
  const [resultado,  setResultado]  = useState(null);
  const [error,      setError]      = useState("");
  const [barWidth,   setBarWidth]   = useState(0);

  const fileInputRef   = useRef(null);
  const dropRef        = useRef(null);
  const stepTimersRef  = useRef([]);

  useEffect(() => () => {
    stepTimersRef.current.forEach(clearTimeout);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  // Animate result bar after result arrives
  useEffect(() => {
    if (phase === "result" && resultado?.scoreRisco != null) {
      const t = setTimeout(() => setBarWidth(resultado.scoreRisco), 80);
      return () => clearTimeout(t);
    }
  }, [phase, resultado]);

  // ── File handling ──────────────────────────────────────────────
  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Envie um arquivo de imagem (PNG, JPG ou WEBP).");
      setPhase("error");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Imagem muito grande. Use até ${MAX_FILE_MB} MB (compacte a imagem se necessário).`);
      setPhase("error");
      return;
    }
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setPhase("preview");
  }

  function onInputChange(e) {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  }

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }, []);

  const onDragOver  = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e) => {
    if (!dropRef.current?.contains(e.relatedTarget)) setIsDragging(false);
  }, []);

  // ── Reset ──────────────────────────────────────────────────────
  function reset() {
    stepTimersRef.current.forEach(clearTimeout);
    setPhase("upload");
    setImageFile(null);
    if (imageUrl) { URL.revokeObjectURL(imageUrl); setImageUrl(null); }
    setLoadStep(-1);
    setLoadPct(0);
    setResultado(null);
    setError("");
    setBarWidth(0);
  }

  // ── Analyze ────────────────────────────────────────────────────
  async function handleAnalyze() {
    if (!imageFile) return;

    const base64 = await fileToBase64(imageFile);

    const apiPromise = fetch("/api/scan-bilhete", {
      method:  "POST",
      headers: buildAuthHeaders(),
      body:    JSON.stringify({ imageBase64: base64, mimeType: imageFile.type || "image/jpeg" }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Falha ao processar bilhete.");
      return data.analise;
    });

    // Transition to loading and fire animation
    setPhase("loading");
    setLoadStep(0);
    setLoadPct(LOAD_STEPS[0].pct);

    stepTimersRef.current = STEP_DELAYS_MS.map((delay, i) =>
      setTimeout(() => {
        setLoadStep(i);
        setLoadPct(LOAD_STEPS[i].pct);
      }, delay)
    );

    apiPromise
      .then((data) => {
        stepTimersRef.current.forEach(clearTimeout);
        setLoadPct(100);
        setTimeout(() => { setResultado(data); setPhase("result"); }, 380);
      })
      .catch((err) => {
        stepTimersRef.current.forEach(clearTimeout);
        setError(err.message || "Erro ao analisar bilhete.");
        setPhase("error");
      });
  }

  // ── Derived ────────────────────────────────────────────────────
  const sc  = resultado ? scoreColor(resultado.scoreRisco) : "#1FCB7A";
  const sbg = resultado ? scoreBg(resultado.scoreRisco)    : "transparent";

  return (
    <div className="ib-page">
      <style>{CSS}</style>

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="ib-hdr">
        <button className="ib-hdr-back" onClick={() => navigate("/analisar")}>
          <IconLeft /> Voltar
        </button>
        <span className="ib-hdr-logo">MotorIA Pro</span>
        <span className="ib-hdr-tag">SCANNER</span>
      </header>

      {/* ── Upload ───────────────────────────────────────────── */}
      {phase === "upload" && (
        <div className="ib-upload-wrap">
          <h1 className="ib-title">Importe seu bilhete</h1>
          <p className="ib-subtitle">
            A IA analisa o risco da sua múltipla em segundos.
          </p>

          <div
            ref={dropRef}
            className={`ib-drop${isDragging ? " ib-drag" : ""}`}
            role="button"
            tabIndex={0}
            aria-label="Enviar print do bilhete"
            onClick={() => fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          >
            <div className="ib-drop-ico"><IconScan /></div>
            <div>
              <div className="ib-drop-txt">Envie um print da sua aposta</div>
              <div className="ib-drop-hint">PNG, JPG ou WEBP · máx 3 MB</div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={onInputChange}
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>

          <div className="ib-houses">
            {["Betano","Bet365","Sportingbet","KTO","Novibet","Superbet","Pinnacle"].map(h => (
              <span key={h} className="ib-house">{h}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Preview ──────────────────────────────────────────── */}
      {phase === "preview" && (
        <div className="ib-preview-wrap">
          <div className="ib-preview-card">
            <img src={imageUrl} alt="Preview do bilhete" className="ib-preview-img" />
            <div className="ib-preview-foot">
              <span className="ib-preview-name">{imageFile?.name}</span>
              <span className="ib-preview-size">
                {imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(1)} MB` : ""}
              </span>
            </div>
          </div>
          <button className="ib-btn-primary" onClick={handleAnalyze}>
            Analisar Bilhete
          </button>
          <button className="ib-btn-secondary" onClick={reset}>
            Trocar imagem
          </button>
        </div>
      )}

      {/* ── Loading ──────────────────────────────────────────── */}
      {phase === "loading" && (
        <div className="ib-loading-wrap">
          <div className="ib-loading-brand">
            <span className="ib-pulse-dot" />
            Motor de Risco
          </div>

          <div className="ib-ring-wrap">
            <div className="ib-ring" />
            <span className="ib-ring-pct">{loadPct}%</span>
          </div>

          <div className="ib-steps" role="status" aria-live="polite" aria-label="Progresso da análise">
            {LOAD_STEPS.map((step, i) => {
              const isDone   = i < loadStep;
              const isActive = i === loadStep;
              return (
                <div
                  key={step.label}
                  className={[
                    "ib-step",
                    i <= loadStep ? "vis"  : "",
                    isDone        ? "done" : "",
                    isActive      ? "act"  : "",
                  ].filter(Boolean).join(" ")}
                >
                  <div className="ib-step-ind">
                    {isDone ? <IconCheck /> : i + 1}
                  </div>
                  <span className="ib-step-lbl">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Result ───────────────────────────────────────────── */}
      {phase === "result" && resultado && (
        <div className="ib-result-wrap">

          {/* Score hero */}
          <div className="ib-hero">
            <div className="ib-hero-glow" style={{ background: sc }} />
            <div className="ib-hero-sup">Risco Geral</div>
            <div className="ib-hero-num" style={{ color: sc }}>
              {resultado.scoreRisco}
              <span className="ib-hero-den">/100</span>
            </div>
            <div
              className="ib-hero-badge"
              style={{ background: sbg, color: sc, border: `1px solid ${sc}28` }}
            >
              <span className="ib-hero-dot" style={{ background: sc }} />
              {resultado.veredicto}
            </div>
            <div className="ib-bar-track">
              <div className="ib-bar-fill" style={{ width: `${barWidth}%`, background: sc }} />
            </div>
          </div>

          {/* Stats */}
          <div className="ib-stats">
            <div className="ib-stat">
              <div className="ib-stat-lbl">Chance Estimada</div>
              <div className="ib-stat-val">
                {resultado.chanceImplicita != null
                  ? resultado.chanceImplicita.toFixed(1)
                  : "—"}
                <span className="ib-stat-unit">%</span>
              </div>
            </div>
            <div className="ib-stat">
              <div className="ib-stat-lbl">Odd Total</div>
              <div className="ib-stat-val">
                {resultado.oddTotal != null ? resultado.oddTotal.toFixed(2) : "—"}
              </div>
            </div>
          </div>

          {/* Alertas */}
          {resultado.alertas?.length > 0 && (
            <>
              <div className="ib-sec-lbl">Alertas Detectados</div>
              <div className="ib-alerts">
                {resultado.alertas.map((a, i) => (
                  <div
                    key={i}
                    className="ib-alert"
                    style={{ borderLeftColor: alertBorderColor(a.tipo) }}
                  >
                    <span className="ib-alert-dot" style={{ background: alertBorderColor(a.tipo) }} />
                    <span
                      className="ib-alert-txt"
                      style={{ color: alertTextColor(a.tipo) }}
                    >
                      {a.texto}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Seleções */}
          {resultado.selecoes?.length > 0 && (
            <>
              <div className="ib-sec-lbl">
                Seleções do Bilhete
                {resultado.numSelecoes != null && ` · ${resultado.numSelecoes}`}
              </div>
              <div className="ib-sels">
                {[...resultado.selecoes]
                  .sort((a, b) => (b.riscoSelecao ?? 0) - (a.riscoSelecao ?? 0))
                  .map((s, i) => {
                    const c  = s.riscoSelecao != null ? scoreColor(s.riscoSelecao) : "#4B5563";
                    const bg = s.riscoSelecao != null ? scoreBg(s.riscoSelecao)    : "rgba(75,85,99,0.09)";
                    return (
                      <div key={i} className="ib-sel">
                        <div className="ib-sel-score" style={{ background: bg, color: c }}>
                          {s.riscoSelecao ?? "—"}
                        </div>
                        <div className="ib-sel-info">
                          <div className="ib-sel-jogo">{s.jogo || "Jogo não identificado"}</div>
                          <div className="ib-sel-mkt">
                            {s.mercado || "Mercado"}
                            {s.escolha ? ` · ${s.escolha}` : ""}
                          </div>
                        </div>
                        <div className="ib-sel-odd">
                          {s.odd != null ? `@${Number(s.odd).toFixed(2)}` : "—"}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          )}

          {/* Leitura do motor */}
          {resultado.analise && (
            <>
              <div className="ib-sec-lbl">Leitura do Motor</div>
              <div className="ib-analise">
                <p className="ib-analise-txt">{resultado.analise}</p>
              </div>
            </>
          )}

          <button className="ib-btn-reset" onClick={reset}>
            Analisar outro bilhete
          </button>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────── */}
      {phase === "error" && (
        <div className="ib-err-wrap">
          <div className="ib-err-ico">⚠</div>
          <div className="ib-err-title">Não foi possível analisar</div>
          <p className="ib-err-msg">{error || "Envie uma imagem mais nítida do bilhete."}</p>
          <button className="ib-btn-retry" onClick={reset}>Tentar novamente</button>
        </div>
      )}
    </div>
  );
}
