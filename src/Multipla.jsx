import { useState, useEffect } from "react";
import { LegalBar, Header, Footer } from "./Layout";
import { useAuth } from "./contexts/AuthContext";
import { loadSlips, saveSlip, updateSlipResult, deleteSlip } from "./lib/multiplaDb";
import { buildSafeHeaders } from "./utils/safeHeaders";

const ADMIN_BYPASS_KEY = "MOTORIA_OWNER_KEY_2026";

function buildAuthHeaders(session) {
  const adminKey = localStorage.getItem("motoria_admin_key");
  if (adminKey === ADMIN_BYPASS_KEY) {
    return buildSafeHeaders({ "Content-Type": "application/json", "x-admin-key": ADMIN_BYPASS_KEY });
  }
  return buildSafeHeaders({
    "Content-Type": "application/json",
    ...(session?.access_token && String(session.access_token).length > 10
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}),
  });
}

const MERCADOS = [
  "Resultado da partida",
  "Mais ou menos gols",
  "Ambos marcam",
  "Handicap",
  "Escanteios",
  "Cartões",
  "Chance dupla",
];

const ACCESS_KEY = "motoria_access_v1";

function riskColor(level) {
  if (!level) return "#FFB020";
  if (level === "muito alto" || level === "alto") return "#FF4D2E";
  if (level === "médio") return "#FFB020";
  return "#1FCB7A";
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function Multipla() {
  const { session, isPaid } = useAuth();
  const accessGranted = isPaid || localStorage.getItem(ACCESS_KEY) === "1";

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState("nova"); // "nova" | "historico"

  // ── Nova análise ──────────────────────────────────────────────────────────
  const [selecoes,   setSelecoes]   = useState([]);
  const [valorTotal, setValorTotal] = useState("");
  const [showForm,   setShowForm]   = useState(false);
  const [nova,       setNova]       = useState({ jogo: "", mercado: MERCADOS[0], odd: "" });
  const [resultado,  setResultado]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [saved,      setSaved]      = useState(false);

  const oddTotal   = selecoes.reduce((acc, s) => acc * s.odd, 1);
  const chanceReal = selecoes.length > 0 ? (1 / oddTotal) * 100 : 0;
  const corOdd     = oddTotal < 3 ? "#1FCB7A" : oddTotal < 6 ? "#FFB020" : "#FF4D2E";

  // ── Histórico ─────────────────────────────────────────────────────────────
  const [historico,     setHistorico]     = useState([]);
  const [histLoading,   setHistLoading]   = useState(false);
  const [updatingId,    setUpdatingId]    = useState(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    setHistLoading(true);
    loadSlips(session.user.id)
      .then(setHistorico)
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, [session?.user?.id, tab]);

  // ── Handlers nova análise ─────────────────────────────────────────────────
  function adicionarSelecao() {
    const oddN = parseFloat(nova.odd.replace(",", "."));
    if (!nova.jogo.trim() || isNaN(oddN) || oddN <= 1) return;
    setSelecoes((p) => [...p, { id: Date.now(), jogo: nova.jogo, mercado: nova.mercado, odd: oddN }]);
    setNova({ jogo: "", mercado: MERCADOS[0], odd: "" });
    setShowForm(false);
    setResultado(null);
    setSaved(false);
  }

  function removerSelecao(id) {
    setSelecoes((p) => p.filter((s) => s.id !== id));
    setResultado(null);
    setSaved(false);
  }

  async function analisarBilhete() {
    if (selecoes.length < 2) { setError("Adicione pelo menos 2 seleções."); return; }
    setError("");
    setLoading(true);
    setSaved(false);
    try {
      const headers = buildAuthHeaders(session);

      const res  = await fetch("/api/analyze-multipla", {
        method: "POST",
        headers,
        body: JSON.stringify({ selecoes, valorTotal, oddTotal, chanceReal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao analisar.");
      setResultado(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function salvarBilhete() {
    if (!session?.user?.id || !resultado) return;
    try {
      await saveSlip(session.user.id, {
        stake:      valorTotal,
        oddTotal:   parseFloat(resultado.oddTotal || oddTotal),
        chanceReal: parseFloat(resultado.chanceReal || chanceReal),
        riskLevel:  resultado.nivelRisco,
        selecoes,
      });
      setSaved(true);
    } catch (_) {}
  }

  function novaAnalise() {
    setSelecoes([]);
    setResultado(null);
    setValorTotal("");
    setError("");
    setSaved(false);
  }

  // ── Handlers histórico ────────────────────────────────────────────────────
  async function marcarResultado(slipId, novoResultado) {
    setUpdatingId(slipId);
    try {
      await updateSlipResult(slipId, novoResultado);
      setHistorico((prev) =>
        prev.map((s) => s.id === slipId ? { ...s, resultado: novoResultado } : s)
      );
    } catch (_) {}
    setUpdatingId(null);
  }

  async function excluirBilhete(slipId) {
    try {
      await deleteSlip(slipId);
      setHistorico((prev) => prev.filter((s) => s.id !== slipId));
    } catch (_) {}
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <LegalBar />
      <Header />

      <div className="mp-root">
        <div className="mp-wrap">

          {/* Tabs */}
          <div className="mp-tabs">
            <button
              className={`mp-tab${tab === "nova" ? " mp-tab-active" : ""}`}
              onClick={() => setTab("nova")}
            >
              Nova análise
            </button>
            <button
              className={`mp-tab${tab === "historico" ? " mp-tab-active" : ""}`}
              onClick={() => setTab("historico")}
              disabled={!session}
              title={!session ? "Faça login para ver o histórico" : ""}
            >
              Histórico
              {historico.length > 0 && <span className="mp-tab-count">{historico.length}</span>}
            </button>
          </div>

          {/* ══ ABA: NOVA ANÁLISE ══════════════════════════════════════════ */}
          {tab === "nova" && (
            <>
              <p className="mp-sub">Monte seu bilhete e veja o risco combinado.</p>

              {/* Valor apostado */}
              <div className="mp-field">
                <label className="mp-label">QUANTO VAI APOSTAR NO BILHETE? (R$)</label>
                <div className="mp-valor-wrap">
                  <span className="mp-valor-prefix">R$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Ex: 30"
                    value={valorTotal}
                    onChange={(e) => { setValorTotal(e.target.value); setResultado(null); setSaved(false); }}
                    className="mp-input mp-valor-input"
                  />
                </div>
              </div>

              {/* Seleções */}
              {selecoes.map((s) => (
                <div key={s.id} className="mp-selecao">
                  <div className="mp-sel-info">
                    <div className="mp-sel-jogo">{s.jogo}</div>
                    <div className="mp-sel-meta">{s.mercado} · Odd {s.odd.toFixed(2)}</div>
                  </div>
                  <button className="mp-remove-btn" onClick={() => removerSelecao(s.id)} aria-label="Remover">×</button>
                </div>
              ))}

              {/* Form nova seleção */}
              {showForm ? (
                <div className="mp-nova-form">
                  <h3 className="mp-nova-title">Nova seleção</h3>
                  <input
                    className="mp-input"
                    placeholder="Ex: Flamengo × Palmeiras"
                    value={nova.jogo}
                    onChange={(e) => setNova((p) => ({ ...p, jogo: e.target.value }))}
                    autoFocus
                  />
                  <select
                    className="mp-input"
                    value={nova.mercado}
                    onChange={(e) => setNova((p) => ({ ...p, mercado: e.target.value }))}
                  >
                    {MERCADOS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="mp-input"
                    placeholder="Odd (ex: 1.85)"
                    value={nova.odd}
                    onChange={(e) => setNova((p) => ({ ...p, odd: e.target.value }))}
                  />
                  <div className="mp-nova-btns">
                    <button className="mp-cancel-btn" onClick={() => setShowForm(false)}>Cancelar</button>
                    <button className="mp-add-btn" onClick={adicionarSelecao}>Adicionar</button>
                  </div>
                </div>
              ) : (
                <button className="mp-add-sel-btn" onClick={() => setShowForm(true)}>
                  + Adicionar seleção
                </button>
              )}

              {error && <div className="mp-err">{error}</div>}

              {/* Resumo + analisar */}
              {selecoes.length >= 2 && !resultado && (
                <div className="mp-summary">
                  <div className="mp-summary-row">
                    <div>
                      <div className="mp-sum-label">ODD TOTAL</div>
                      <div className="mp-sum-val" style={{ color: corOdd }}>{oddTotal.toFixed(2)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="mp-sum-label">CHANCE DE ACERTAR</div>
                      <div className="mp-sum-val" style={{ color: chanceReal < 20 ? "#FF4D2E" : "#FFB020" }}>
                        {chanceReal.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <button className="mp-analyze-btn" onClick={analisarBilhete} disabled={loading}>
                    {loading ? "Analisando…" : `Analisar bilhete (${selecoes.length} seleções) →`}
                  </button>
                </div>
              )}

              {/* Resultado */}
              {resultado && (
                <div className="mp-result">
                  {!resultado.isPaid && !accessGranted ? (
                    /* ── Lock screen ─────────────────────────────────── */
                    <div className="mp-lock">
                      <div className="mp-lock-header">
                        <span className="mp-lock-dot" />
                        <span className="mp-lock-label">Risco identificado no bilhete</span>
                      </div>
                      <p className="mp-lock-msg">{resultado.mensagem}</p>
                      <div className="mp-lock-chips">
                        {(resultado.alertas || []).map((a, i) => (
                          <div key={i} className="mp-chip">{a}</div>
                        ))}
                      </div>
                      <div className="mp-lock-cta">
                        <p className="mp-lock-cta-title">Resultado parcial identificado.</p>
                        <p className="mp-lock-cta-sub">
                          O MotorIA encontrou sinais importantes de risco neste bilhete.
                        </p>
                        <a
                          href="https://pay.kiwify.com.br/DIVD8zl"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mp-unlock-btn"
                        >
                          Desbloquear análise completa
                        </a>
                        <p className="mp-lock-price">
                          Pagamento único · sem mensalidade · acesso imediato · R$27
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* ── Resultado completo ──────────────────────────── */
                    <>
                      <div className="mp-res-risk" style={{
                        borderColor: `${riskColor(resultado.nivelRisco)}33`,
                      }}>
                        <div className="mp-res-risk-label">RISCO DO BILHETE</div>
                        <div className="mp-res-risk-val" style={{ color: riskColor(resultado.nivelRisco) }}>
                          {resultado.nivelRisco?.toUpperCase()}
                        </div>
                      </div>

                      <div className="mp-res-cards">
                        <div className="mp-res-card">
                          <div className="mp-res-card-label">ODD TOTAL</div>
                          <div className="mp-res-card-val" style={{ color: corOdd }}>
                            {resultado.oddTotal}
                          </div>
                        </div>
                        <div className="mp-res-card">
                          <div className="mp-res-card-label">CHANCE REAL</div>
                          <div className="mp-res-card-val" style={{ color: parseFloat(resultado.chanceReal) < 20 ? "#FF4D2E" : "#FFB020" }}>
                            {resultado.chanceReal}%
                          </div>
                        </div>
                      </div>

                      {resultado.percentualBanca && (
                        <div className="mp-res-banca">
                          <strong>{resultado.percentualBanca}%</strong> da sua banca em risco nesse bilhete.
                        </div>
                      )}

                      <div className="mp-res-msg">{resultado.mensagem}</div>

                      {resultado.alertaBanca && (
                        <div className="mp-res-alert">{resultado.alertaBanca}</div>
                      )}

                      {resultado.explicacao && (
                        <div className="mp-res-explain">{resultado.explicacao}</div>
                      )}

                      {/* Ações */}
                      <div className="mp-res-actions">
                        {session && !saved && (
                          <button className="mp-save-btn" onClick={salvarBilhete}>
                            Salvar no histórico
                          </button>
                        )}
                        {saved && (
                          <span className="mp-saved-tag">✓ Salvo</span>
                        )}
                        <button className="mp-reset-btn" onClick={novaAnalise}>
                          ← Novo bilhete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* ══ ABA: HISTÓRICO ════════════════════════════════════════════ */}
          {tab === "historico" && (
            <div className="mp-hist">
              {!session ? (
                <div className="mp-hist-empty">
                  <p>Faça login para ver seu histórico de bilhetes.</p>
                  <a href="/login" className="mp-unlock-btn" style={{ display: "inline-block", textDecoration: "none" }}>
                    Entrar
                  </a>
                </div>
              ) : histLoading ? (
                <div className="mp-hist-empty">Carregando…</div>
              ) : historico.length === 0 ? (
                <div className="mp-hist-empty">
                  <p>Nenhum bilhete salvo ainda.</p>
                  <button className="mp-cancel-btn" onClick={() => setTab("nova")}>
                    Analisar bilhete →
                  </button>
                </div>
              ) : (
                historico.map((slip) => (
                  <div key={slip.id} className="mp-hist-card">
                    <div className="mp-hist-card-top">
                      <div>
                        <span className="mp-hist-risk" style={{ color: riskColor(slip.riskLevel) }}>
                          {(slip.riskLevel || "—").toUpperCase()}
                        </span>
                        <span className="mp-hist-date">{fmtDate(slip.createdAt)}</span>
                      </div>
                      <button
                        className="mp-hist-del"
                        onClick={() => excluirBilhete(slip.id)}
                        aria-label="Excluir"
                      >
                        ×
                      </button>
                    </div>

                    <div className="mp-hist-metrics">
                      <span>Odd <strong style={{ color: slip.oddTotal < 3 ? "#1FCB7A" : slip.oddTotal < 6 ? "#FFB020" : "#FF4D2E" }}>
                        {slip.oddTotal?.toFixed(2)}
                      </strong></span>
                      <span>Chance <strong style={{ color: slip.chanceReal < 20 ? "#FF4D2E" : "#FFB020" }}>
                        {slip.chanceReal?.toFixed(1)}%
                      </strong></span>
                      {slip.stake && <span>Valor <strong>R${parseFloat(slip.stake).toFixed(2)}</strong></span>}
                      <span>{slip.selecoes?.length || 0} seleções</span>
                    </div>

                    {slip.selecoes?.length > 0 && (
                      <div className="mp-hist-sels">
                        {slip.selecoes.map((s, i) => (
                          <div key={i} className="mp-hist-sel">
                            <span className="mp-hist-sel-jogo">{s.jogo}</span>
                            <span className="mp-hist-sel-odd">Odd {parseFloat(s.odd).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Resultado */}
                    <div className="mp-hist-res-row">
                      <span className="mp-hist-res-label">Resultado:</span>
                      <div className="mp-hist-res-btns">
                        {["pendente", "ganhou", "perdeu"].map((opt) => (
                          <button
                            key={opt}
                            disabled={updatingId === slip.id}
                            onClick={() => marcarResultado(slip.id, opt)}
                            className={`mp-hist-res-btn mp-hist-res-${opt}${slip.resultado === opt ? " mp-hist-res-active" : ""}`}
                          >
                            {opt === "pendente" ? "Pendente" : opt === "ganhou" ? "Ganhou" : "Perdeu"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>

      <Footer />
    </>
  );
}

const CSS = `
.mp-root { min-height: 80vh; padding: 0 0 80px; font-family: 'Inter', sans-serif; }
.mp-wrap { max-width: 560px; margin: 0 auto; padding: 28px 20px; display: flex; flex-direction: column; gap: 12px; }
.mp-sub { font-size: 14px; color: #6B7280; margin: 0 0 4px; }

/* ── Tabs ─────────────────────────────────────────────────── */
.mp-tabs { display: flex; gap: 4px; background: #111112; border: 1px solid #1E1E1F; border-radius: 12px; padding: 4px; }
.mp-tab { flex: 1; padding: 10px 8px; background: transparent; border: none; border-radius: 8px; color: #555; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px; }
.mp-tab:hover:not(:disabled) { color: #aaa; }
.mp-tab:disabled { opacity: 0.4; cursor: not-allowed; }
.mp-tab-active { background: #1A1A1D; color: #F2F2F0 !important; }
.mp-tab-count { background: #1FCB7A22; color: #1FCB7A; border-radius: 20px; font-size: 11px; font-weight: 700; padding: 1px 7px; }

/* ── Fields ───────────────────────────────────────────────── */
.mp-field { display: flex; flex-direction: column; gap: 8px; }
.mp-label { font-size: 10px; font-weight: 700; color: #555; letter-spacing: 0.08em; text-transform: uppercase; }
.mp-input { background: #111112; border: 1px solid #222; border-radius: 10px; color: #F2F2F0; font-size: 15px; font-family: inherit; padding: 12px 14px; outline: none; width: 100%; box-sizing: border-box; -webkit-appearance: none; appearance: none; transition: border-color 0.18s; }
.mp-input:focus { border-color: #444; }
.mp-input::placeholder { color: #333; }
.mp-valor-wrap { display: flex; align-items: center; background: #111112; border: 1px solid #222; border-radius: 10px; overflow: hidden; }
.mp-valor-wrap:focus-within { border-color: #444; }
.mp-valor-prefix { padding: 0 4px 0 14px; font-size: 16px; font-weight: 700; color: #1FCB7A; }
.mp-valor-input { border: none !important; background: transparent; padding-left: 4px; font-size: 18px; font-weight: 700; }

/* ── Seleções ─────────────────────────────────────────────── */
.mp-selecao { display: flex; justify-content: space-between; align-items: center; background: #111112; border: 1px solid #1E1E1F; border-radius: 12px; padding: 14px 16px; }
.mp-sel-jogo { font-size: 14px; font-weight: 700; color: #F2F2F0; margin-bottom: 2px; }
.mp-sel-meta { font-size: 11px; color: #555; }
.mp-remove-btn { background: none; border: none; color: #FF4D2E; font-size: 20px; cursor: pointer; padding: 4px 8px; line-height: 1; opacity: 0.7; transition: opacity 0.15s; }
.mp-remove-btn:hover { opacity: 1; }

/* ── Form nova seleção ────────────────────────────────────── */
.mp-nova-form { background: #111112; border: 1px solid rgba(31,203,122,0.2); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.mp-nova-title { font-size: 14px; font-weight: 700; color: #F2F2F0; }
.mp-nova-btns { display: flex; gap: 8px; }
.mp-cancel-btn { flex: 1; padding: 12px; background: transparent; border: 1px solid #222; border-radius: 8px; color: #555; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.15s; }
.mp-cancel-btn:hover { border-color: #444; color: #888; }
.mp-add-btn { flex: 2; padding: 12px; background: #1FCB7A; border: none; border-radius: 8px; color: #000; font-weight: 900; font-family: inherit; cursor: pointer; transition: opacity 0.15s; }
.mp-add-btn:hover { opacity: 0.9; }
.mp-add-sel-btn { width: 100%; padding: 14px; background: transparent; border: 1px dashed rgba(31,203,122,0.35); border-radius: 12px; color: #1FCB7A; font-weight: 700; font-size: 14px; font-family: inherit; cursor: pointer; transition: all 0.15s; }
.mp-add-sel-btn:hover { background: rgba(31,203,122,0.04); border-color: rgba(31,203,122,0.6); }

/* ── Resumo ───────────────────────────────────────────────── */
.mp-err { background: rgba(255,77,46,0.08); border: 1px solid rgba(255,77,46,0.2); border-radius: 10px; color: #f87171; font-size: 14px; padding: 12px 14px; }
.mp-summary { background: #111112; border: 1px solid #1E1E1F; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 14px; }
.mp-summary-row { display: flex; justify-content: space-between; align-items: flex-start; }
.mp-sum-label { font-size: 10px; font-weight: 700; color: #444; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; }
.mp-sum-val { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 900; }
.mp-analyze-btn { width: 100%; padding: 15px; background: #1FCB7A; border: none; border-radius: 10px; color: #000; font-weight: 900; font-size: 15px; font-family: inherit; cursor: pointer; transition: opacity 0.15s; }
.mp-analyze-btn:hover { opacity: 0.9; }
.mp-analyze-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Resultado ────────────────────────────────────────────── */
.mp-result { display: flex; flex-direction: column; gap: 12px; }

/* Lock */
.mp-lock { background: #111112; border: 1px solid #1E1E1F; border-radius: 14px; padding: 22px; display: flex; flex-direction: column; gap: 14px; }
.mp-lock-header { display: flex; align-items: center; gap: 8px; }
.mp-lock-dot { width: 8px; height: 8px; border-radius: 50%; background: #1FCB7A; animation: mp-pulse 2s infinite; flex-shrink: 0; }
@keyframes mp-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
.mp-lock-label { font-size: 12px; font-weight: 700; color: #1FCB7A; letter-spacing: 0.07em; text-transform: uppercase; }
.mp-lock-msg { font-size: 15px; color: #aaa; line-height: 1.6; margin: 0; }
.mp-lock-chips { display: flex; flex-direction: column; gap: 8px; }
.mp-chip { background: rgba(31,203,122,0.06); border: 1px solid rgba(31,203,122,0.15); border-radius: 8px; padding: 9px 13px; font-size: 13px; color: #ccc; }
.mp-lock-cta { background: #0D0D0F; border: 1px solid rgba(31,203,122,0.15); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
.mp-lock-cta-title { font-weight: 700; font-size: 15px; color: #F2F2F0; margin: 0; }
.mp-lock-cta-sub { font-size: 13px; color: #666; margin: 0; line-height: 1.5; }
.mp-unlock-btn { display: block; text-align: center; padding: 15px; background: #1FCB7A; color: #000; font-size: 14px; font-weight: 900; border-radius: 10px; text-decoration: none; transition: opacity 0.15s; border: none; cursor: pointer; font-family: inherit; }
.mp-unlock-btn:hover { opacity: 0.9; }
.mp-lock-price { font-size: 11px; color: #3A3A3E; text-align: center; margin: 0; }

/* Resultado completo */
.mp-res-risk { border: 1px solid; border-radius: 12px; padding: 18px; }
.mp-res-risk-label { font-size: 10px; font-weight: 700; color: #444; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
.mp-res-risk-val { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 900; }
.mp-res-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.mp-res-card { background: #111112; border: 1px solid #1E1E1F; border-radius: 12px; padding: 16px; }
.mp-res-card-label { font-size: 9px; font-weight: 700; color: #444; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
.mp-res-card-val { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 900; }
.mp-res-banca { background: rgba(255,176,32,0.06); border: 1px solid rgba(255,176,32,0.2); border-radius: 10px; padding: 13px 15px; font-size: 14px; color: #FFB020; }
.mp-res-msg { font-size: 15px; color: #bbb; line-height: 1.7; }
.mp-res-alert { background: rgba(255,77,46,0.07); border: 1px solid rgba(255,77,46,0.2); border-radius: 10px; padding: 13px 15px; font-size: 14px; color: #FF4D2E; line-height: 1.6; }
.mp-res-explain { font-size: 13px; color: #555; line-height: 1.6; font-style: italic; }
.mp-res-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.mp-save-btn { padding: 10px 18px; background: rgba(31,203,122,0.1); border: 1px solid rgba(31,203,122,0.3); border-radius: 8px; color: #1FCB7A; font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer; transition: all 0.15s; }
.mp-save-btn:hover { background: rgba(31,203,122,0.16); }
.mp-saved-tag { font-size: 13px; color: #1FCB7A; font-weight: 700; }
.mp-reset-btn { background: none; border: 1px solid #1E1E1F; border-radius: 8px; color: #444; font-size: 13px; font-family: inherit; padding: 9px 14px; cursor: pointer; transition: all 0.15s; }
.mp-reset-btn:hover { border-color: #444; color: #888; }

/* ── Histórico ────────────────────────────────────────────── */
.mp-hist { display: flex; flex-direction: column; gap: 12px; }
.mp-hist-empty { text-align: center; padding: 48px 20px; color: #555; font-size: 14px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.mp-hist-card { background: #111112; border: 1px solid #1E1E1F; border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.mp-hist-card-top { display: flex; justify-content: space-between; align-items: flex-start; }
.mp-hist-risk { font-size: 13px; font-weight: 800; display: block; margin-bottom: 4px; }
.mp-hist-date { font-size: 11px; color: #444; }
.mp-hist-del { background: none; border: none; color: #333; font-size: 18px; cursor: pointer; padding: 2px 6px; transition: color 0.15s; }
.mp-hist-del:hover { color: #FF4D2E; }
.mp-hist-metrics { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12px; color: #666; }
.mp-hist-metrics strong { font-weight: 700; }
.mp-hist-sels { display: flex; flex-direction: column; gap: 6px; }
.mp-hist-sel { display: flex; justify-content: space-between; font-size: 12px; padding: 6px 0; border-bottom: 1px solid #1A1A1D; }
.mp-hist-sel:last-child { border-bottom: none; }
.mp-hist-sel-jogo { color: #aaa; }
.mp-hist-sel-odd { color: #555; }
.mp-hist-res-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding-top: 4px; }
.mp-hist-res-label { font-size: 11px; color: #444; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
.mp-hist-res-btns { display: flex; gap: 6px; }
.mp-hist-res-btn { padding: 5px 12px; border-radius: 20px; border: 1px solid #222; background: transparent; color: #555; font-size: 12px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.15s; }
.mp-hist-res-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mp-hist-res-ganhou.mp-hist-res-active { background: rgba(31,203,122,0.12); border-color: rgba(31,203,122,0.35); color: #1FCB7A; }
.mp-hist-res-perdeu.mp-hist-res-active { background: rgba(255,77,46,0.1); border-color: rgba(255,77,46,0.3); color: #FF4D2E; }
.mp-hist-res-pendente.mp-hist-res-active { background: rgba(255,176,32,0.08); border-color: rgba(255,176,32,0.25); color: #FFB020; }
`;
