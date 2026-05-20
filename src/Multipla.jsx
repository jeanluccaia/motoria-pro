import { useState, useEffect, useRef } from "react";
import { LegalBar, Header, Footer } from "./Layout";
import { useNavigate } from "./router";
import { useAuth } from "./contexts/AuthContext";
import { loadSlips, saveSlip, updateSlipResult, deleteSlip } from "./lib/multiplaDb";
import { buildSafeHeaders } from "./utils/safeHeaders";

const ADMIN_BYPASS_KEY = "MOTORIA_OWNER_KEY_2026";
const ACCESS_KEY       = "motoria_access_v1";
const MULTIPLA_DRAFT_KEY = "motoria_multipla_seed";
const CODE_SESSION_KEY = "motoria_code_session";

function getCodeSessionToken() {
  try {
    const s = JSON.parse(localStorage.getItem(CODE_SESSION_KEY) || "null");
    return s?.sessionToken || "";
  } catch {
    return "";
  }
}

function buildAuthHeaders(session) {
  const adminKey = localStorage.getItem("motoria_admin_key");
  const codeSessionToken = getCodeSessionToken();
  if (adminKey === ADMIN_BYPASS_KEY) {
    return buildSafeHeaders({ "Content-Type": "application/json", "x-admin-key": ADMIN_BYPASS_KEY });
  }
  return buildSafeHeaders({
    "Content-Type": "application/json",
    ...(codeSessionToken ? { "x-motoria-code-session": codeSessionToken } : {}),
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
  "Empate devolve",
  "Outro",
];

function riskColor(level) {
  if (!level) return "#FFB020";
  const l = level.toLowerCase();
  if (l === "muito alto" || l === "alto") return "#FF4D2E";
  if (l === "médio")                      return "#FFB020";
  return "#22c55e";
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function IconX({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

const EMPTY = { jogo: "", mercado: MERCADOS[0], odd: "", obs: "" };

function readInitialDraft() {
  try {
    const raw = window.sessionStorage.getItem(MULTIPLA_DRAFT_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(MULTIPLA_DRAFT_KEY);

    const data = JSON.parse(raw);
    const incoming = Array.isArray(data?.selecoes)
      ? data.selecoes
      : data?.selection
        ? [data.selection]
        : [];

    const selecoes = incoming.map((s, idx) => {
      const odd = parseFloat(String(s?.odd ?? "").replace(",", "."));
      const jogo = String(s?.jogo || "").trim();
      if (!jogo || isNaN(odd) || odd <= 1) return null;
      return {
        id: s.id || Date.now() + idx,
        jogo,
        mercado: String(s.mercado || s.tipo || MERCADOS[0]).trim(),
        odd,
        obs: String(s.obs || "").trim(),
      };
    }).filter(Boolean);

    if (!selecoes.length) return null;
    return {
      selecoes,
      valorTotal: String(data?.valorTotal || data?.valor || ""),
      bancaAtual: String(data?.bancaAtual || ""),
      openModal: data?.openModal !== false,
    };
  } catch {
    return null;
  }
}

export default function Multipla() {
  const { session, isPaid } = useAuth();
  const navigate            = useNavigate();
  const accessGranted       = isPaid || localStorage.getItem(ACCESS_KEY) === "1";
  const initialDraftRef     = useRef();
  if (initialDraftRef.current === undefined) {
    initialDraftRef.current = readInitialDraft();
  }
  const initialDraft = initialDraftRef.current;

  const [tab, setTab] = useState("nova");

  // Form state — phase 0 (inline) and modal share the same object
  const [form,      setForm]      = useState(EMPTY);
  const [selecoes,  setSelecoes]  = useState(() => initialDraft?.selecoes || []);
  const [showModal, setShowModal] = useState(() => Boolean(initialDraft?.openModal));

  // Financial
  const [valorTotal, setValorTotal] = useState(() => initialDraft?.valorTotal || "");
  const [bancaAtual, setBancaAtual] = useState(() => initialDraft?.bancaAtual || "");

  // Analysis
  const [resultado, setResultado] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [saved,     setSaved]     = useState(false);

  // Computed
  const isMultipla = selecoes.length >= 2;
  const allOdd  = selecoes.length > 0 ? selecoes.reduce((a, s) => a * parseFloat(s.odd), 1) : 0;
  const chance  = allOdd > 0 ? (1 / allOdd) * 100 : 0;
  const valor   = parseFloat(valorTotal) || 0;
  const banca   = parseFloat(bancaAtual)  || 0;
  const retorno = valor > 0 && allOdd > 0 ? (valor * allOdd).toFixed(2) : null;
  const pctB    = banca > 0 && valor > 0 ? ((valor / banca) * 100).toFixed(1) : null;
  const cOdd    = allOdd < 3 ? "#22c55e" : allOdd < 6 ? "#FFB020" : "#FF4D2E";
  const cChance = chance < 20 ? "#FF4D2E" : chance < 40 ? "#FFB020" : "#22c55e";

  // Histórico
  const [historico,   setHistorico]   = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [updatingId,  setUpdatingId]  = useState(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    setHistLoading(true);
    loadSlips(session.user.id).then(setHistorico).catch(() => {}).finally(() => setHistLoading(false));
  }, [session?.user?.id, tab]);

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") setShowModal(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showModal]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function formValido() {
    const n = parseFloat((form.odd || "").replace(",", "."));
    return form.jogo.trim().length > 0 && !isNaN(n) && n > 1;
  }

  function coletarSelecao() {
    const oddN = parseFloat(form.odd.replace(",", "."));
    return { id: Date.now(), jogo: form.jogo.trim(), mercado: form.mercado, odd: oddN, obs: form.obs.trim() };
  }

  // ── Fase 0: analisar entrada simples diretamente ─────────────────────────────
  function handleAnalisarSimples() {
    if (!formValido()) return;
    const sel = coletarSelecao();
    const sels = [sel];
    setSelecoes(sels);
    setForm(EMPTY);
    setResultado(null);
    setSaved(false);
    executarAnalise(sels);
  }

  // ── Fase 0 → 1: salvar e abrir modal para seleção 2 ─────────────────────────
  function handleAdicionarMultipla() {
    if (!formValido()) return;
    const sel = coletarSelecao();
    setSelecoes([sel]);
    setForm(EMPTY);
    setResultado(null);
    setSaved(false);
    setShowModal(true);
  }

  // ── Fase 1+: adicionar seleção via modal ─────────────────────────────────────
  function handleSalvarModal() {
    if (!formValido()) return;
    const sel = coletarSelecao();
    setSelecoes(p => [...p, sel]);
    setForm(EMPTY);
    setShowModal(false);
    setResultado(null);
    setSaved(false);
  }

  function remover(id) {
    setSelecoes(p => p.filter(s => s.id !== id));
    setResultado(null);
    setSaved(false);
  }

  // ── Análise ──────────────────────────────────────────────────────────────────
  async function executarAnalise(sels = selecoes) {
    if (sels.length === 0) return;
    const oddTot  = sels.reduce((a, s) => a * parseFloat(s.odd), 1);
    const chanceTot = (1 / oddTot) * 100;
    setError("");
    setLoading(true);
    setSaved(false);
    try {
      const res  = await fetch("/api/analyze-multipla", {
        method: "POST",
        headers: buildAuthHeaders(session),
        body: JSON.stringify({
          selecoes: sels,
          valorTotal: valor,
          oddTotal:   oddTot,
          chanceReal: chanceTot,
          bancaAtual: banca,
        }),
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

  async function salvarHistorico() {
    if (!session?.user?.id || !resultado) return;
    try {
      await saveSlip(session.user.id, {
        stake:      valorTotal,
        oddTotal:   parseFloat(resultado.oddTotal || allOdd),
        chanceReal: parseFloat(resultado.chanceReal || chance),
        riskLevel:  resultado.nivelRisco,
        selecoes,
      });
      setSaved(true);
    } catch (_) {}
  }

  function novaAnalise() {
    setSelecoes([]);
    setForm(EMPTY);
    setResultado(null);
    setValorTotal("");
    setBancaAtual("");
    setError("");
    setSaved(false);
  }

  async function marcarResultado(slipId, res) {
    setUpdatingId(slipId);
    try {
      await updateSlipResult(slipId, res);
      setHistorico(prev => prev.map(s => s.id === slipId ? { ...s, resultado: res } : s));
    } catch (_) {}
    setUpdatingId(null);
  }

  async function excluirBilhete(slipId) {
    try {
      await deleteSlip(slipId);
      setHistorico(prev => prev.filter(s => s.id !== slipId));
    } catch (_) {}
  }

  // ── Fases de renderização ─────────────────────────────────────────────────────
  const phase0  = selecoes.length === 0 && !resultado && !loading;
  const showBar = tab === "nova" && selecoes.length > 0 && !resultado && !loading;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <LegalBar />
      <Header />

      <div className="mp-root">
        <div className="mp-page">

          {/* Tabs */}
          <div className="mp-tabs">
            <button className={`mp-tab${tab === "nova" ? " mp-tab-active" : ""}`} onClick={() => setTab("nova")}>
              {isMultipla ? "Bilhete" : "Análise"}
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

          {/* ══ ABA: ANÁLISE ════════════════════════════════════════════════════ */}
          {tab === "nova" && (
            <>
              {/* ─── Fase 0: formulário de entrada + opção de múltipla ─────── */}
              {phase0 && (
                <div className="mp-form">
                  <div className="mp-form-head">
                    <h1 className="mp-form-title">Análise de risco</h1>
                    <p className="mp-form-sub">Preencha os dados da entrada para analisar.</p>
                  </div>

                  {/* Campos da seleção */}
                  <div className="mp-field">
                    <label className="mp-label">JOGO / EVENTO</label>
                    <input
                      className="mp-input"
                      placeholder="Ex: Flamengo × Palmeiras"
                      value={form.jogo}
                      onChange={e => setForm(p => ({ ...p, jogo: e.target.value }))}
                      autoFocus
                    />
                  </div>

                  <div className="mp-field">
                    <label className="mp-label">MERCADO</label>
                    <select
                      className="mp-input mp-select"
                      value={form.mercado}
                      onChange={e => setForm(p => ({ ...p, mercado: e.target.value }))}
                    >
                      {MERCADOS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>

                  <div className="mp-field">
                    <label className="mp-label">ODD</label>
                    <input
                      type="number" inputMode="decimal"
                      className="mp-input mp-odd-input"
                      placeholder="Ex: 1.85"
                      value={form.odd}
                      onChange={e => setForm(p => ({ ...p, odd: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && handleAnalisarSimples()}
                    />
                  </div>

                  <div className="mp-field">
                    <label className="mp-label">OBSERVAÇÃO <span className="mp-opt">opcional</span></label>
                    <input
                      className="mp-input"
                      placeholder="Ex: Time mandante em boa fase"
                      value={form.obs}
                      onChange={e => setForm(p => ({ ...p, obs: e.target.value }))}
                      maxLength={100}
                    />
                  </div>

                  {/* Valor + Banca */}
                  <div className="mp-two-col">
                    <div className="mp-field">
                      <label className="mp-label">VALOR (R$)</label>
                      <div className="mp-money-wrap">
                        <span className="mp-money-pre">R$</span>
                        <input
                          type="number" inputMode="decimal"
                          className="mp-input mp-money-input"
                          placeholder="Ex: 30"
                          value={valorTotal}
                          onChange={e => setValorTotal(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="mp-field">
                      <label className="mp-label">BANCA <span className="mp-opt">opcional</span></label>
                      <div className="mp-money-wrap">
                        <span className="mp-money-pre" style={{ color: "#444" }}>R$</span>
                        <input
                          type="number" inputMode="decimal"
                          className="mp-input mp-money-input"
                          placeholder="Ex: 500"
                          value={bancaAtual}
                          onChange={e => setBancaAtual(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── CTAs ──────────────────────────────────────────────── */}
                  <button
                    className="mp-cta-primary"
                    onClick={handleAnalisarSimples}
                    disabled={!formValido()}
                  >
                    Analisar risco da entrada →
                  </button>

                  {/* Divisor + opção múltipla */}
                  <div className="mp-multi-invite">
                    <span className="mp-multi-invite-label">Quer analisar uma múltipla?</span>
                    <button
                      className="mp-cta-multi"
                      onClick={handleAdicionarMultipla}
                      disabled={!formValido()}
                    >
                      + Adicionar outra seleção
                    </button>
                  </div>
                </div>
              )}

              {/* ─── Fase 1+: cards de seleção ─────────────────────────────── */}
              {selecoes.length > 0 && !resultado && (
                <div className="mp-selecoes">

                  {/* Header da fase */}
                  <div className="mp-sel-head">
                    <div>
                      <h1 className="mp-form-title">
                        {isMultipla ? "Bilhete múltiplo" : "Sua entrada"}
                      </h1>
                      <p className="mp-form-sub">
                        {isMultipla
                          ? `${selecoes.length} seleções · Odd total ${allOdd.toFixed(2)}`
                          : "Pronto para analisar ou adicione outra seleção."}
                      </p>
                    </div>
                    {isMultipla && <span className="mp-multi-badge">Múltipla</span>}
                  </div>

                  {selecoes.map((s, idx) => (
                    <div key={s.id} className="mp-sel-card">
                      <div className="mp-sel-num">{idx + 1}</div>
                      <div className="mp-sel-body">
                        <div className="mp-sel-jogo">{s.jogo}</div>
                        <div className="mp-sel-row">
                          <span className="mp-sel-mercado">{s.mercado}</span>
                          <span className="mp-sel-chip">{parseFloat(s.odd).toFixed(2)}</span>
                        </div>
                        {s.obs && <div className="mp-sel-obs">{s.obs}</div>}
                      </div>
                      <button className="mp-sel-rm" onClick={() => {
                        if (selecoes.length === 1) novaAnalise();
                        else remover(s.id);
                      }} aria-label="Remover">
                        <IconX />
                      </button>
                    </div>
                  ))}

                  {/* Fase 1: convite para múltipla */}
                  {selecoes.length === 1 && (
                    <button className="mp-invite-btn" onClick={() => setShowModal(true)}>
                      <span className="mp-invite-q">Quer analisar uma múltipla?</span>
                      <span className="mp-invite-cta">+ Adicionar outra seleção →</span>
                    </button>
                  )}

                  {/* Fase 2+: alerta + add more */}
                  {selecoes.length >= 2 && (
                    <>
                      <div className="mp-dep-alert">
                        <span className="mp-dep-dot" />
                        <span>
                          <strong>{selecoes.length} dependências</strong> — cada seleção aumenta o risco acumulado.
                        </span>
                      </div>
                      <button className="mp-add-more" onClick={() => setShowModal(true)}>
                        + Adicionar seleção
                      </button>
                    </>
                  )}
                </div>
              )}

              {error && <div className="mp-err">{error}</div>}

              {loading && (
                <div className="mp-loading">
                  <div className="mp-spinner" />
                  <p>Analisando risco{isMultipla ? " do bilhete" : " da entrada"}…</p>
                </div>
              )}

              {resultado && !loading && <ResultBlock
                resultado={resultado}
                accessGranted={accessGranted}
                isMultipla={isMultipla}
                selecoes={selecoes}
                cOdd={cOdd}
                cChance={cChance}
                corOdd={cOdd}
                session={session}
                saved={saved}
                onSalvar={salvarHistorico}
                onNova={novaAnalise}
              />}

              {showBar && <div style={{ height: 176 }} />}
            </>
          )}

          {/* ══ ABA: HISTÓRICO ══════════════════════════════════════════════════ */}
          {tab === "historico" && (
            <HistoricoBlock
              session={session}
              histLoading={histLoading}
              historico={historico}
              updatingId={updatingId}
              onTab={() => setTab("nova")}
              onMarca={marcarResultado}
              onExclui={excluirBilhete}
            />
          )}

        </div>

        {/* ── Sticky resumo ──────────────────────────────────────────────────── */}
        {showBar && (
          <div className="mp-bar">
            <div className="mp-bar-inner">

              {/* Stats (só mostra quando múltipla) */}
              {isMultipla && (
                <div className="mp-bar-stats">
                  <Stat label="SELEÇÕES"  val={selecoes.length} />
                  <Stat label="ODD TOTAL" val={allOdd.toFixed(2)} color={cOdd} />
                  <Stat label="CHANCE"    val={`${chance.toFixed(1)}%`} color={cChance} />
                  {retorno && <Stat label="RETORNO" val={`R$${retorno}`} color="#22c55e" />}
                  {pctB    && <Stat label="% BANCA"  val={`${pctB}%`} color={parseFloat(pctB) > 5 ? "#FF4D2E" : "#FFB020"} />}
                </div>
              )}

              {/* Entradas financeiras */}
              <div className="mp-bar-inputs">
                <MoneyInput
                  placeholder={isMultipla ? "Valor total" : "Valor da entrada"}
                  value={valorTotal}
                  prefix="R$"
                  prefixColor="#22c55e"
                  onChange={v => setValorTotal(v)}
                />
                <MoneyInput
                  placeholder="Banca atual"
                  value={bancaAtual}
                  prefix="R$"
                  prefixColor="#444"
                  onChange={v => setBancaAtual(v)}
                />
              </div>

              {/* Preview para 1 seleção */}
              {!isMultipla && selecoes.length === 1 && (
                <div className="mp-bar-preview">
                  <span className="mp-bar-prev-jogo">{selecoes[0].jogo}</span>
                  <span className="mp-bar-prev-odd" style={{ color: cOdd }}>Odd {allOdd.toFixed(2)}</span>
                  {retorno && <span className="mp-bar-prev-ret">→ R${retorno}</span>}
                </div>
              )}

              <button className="mp-bar-cta" onClick={() => executarAnalise()}>
                {isMultipla ? "Analisar risco do bilhete →" : "Analisar risco da entrada →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Modal: nova seleção (fase 1+) ────────────────────────────────── */}
        {showModal && (
          <div className="mp-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="mp-modal">
              <div className="mp-modal-handle" />
              <div className="mp-modal-head">
                <span className="mp-modal-title">Seleção {selecoes.length + 1}</span>
                <button className="mp-modal-x" onClick={() => setShowModal(false)} aria-label="Fechar">
                  <IconX size={16} />
                </button>
              </div>
              <div className="mp-modal-body">
                <div className="mp-field">
                  <label className="mp-label">JOGO / EVENTO</label>
                  <input
                    className="mp-input"
                    placeholder="Ex: Manchester City × Arsenal"
                    value={form.jogo}
                    onChange={e => setForm(p => ({ ...p, jogo: e.target.value }))}
                    autoFocus
                  />
                </div>
                <div className="mp-field">
                  <label className="mp-label">MERCADO</label>
                  <select
                    className="mp-input mp-select"
                    value={form.mercado}
                    onChange={e => setForm(p => ({ ...p, mercado: e.target.value }))}
                  >
                    {MERCADOS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="mp-field">
                  <label className="mp-label">ODD</label>
                  <input
                    type="number" inputMode="decimal"
                    className="mp-input mp-odd-input"
                    placeholder="Ex: 2.10"
                    value={form.odd}
                    onChange={e => setForm(p => ({ ...p, odd: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && handleSalvarModal()}
                  />
                </div>
                <div className="mp-field">
                  <label className="mp-label">OBSERVAÇÃO <span className="mp-opt">opcional</span></label>
                  <input
                    className="mp-input"
                    placeholder="Ex: Mandante em boa sequência"
                    value={form.obs}
                    onChange={e => setForm(p => ({ ...p, obs: e.target.value }))}
                    maxLength={100}
                    onKeyDown={e => e.key === "Enter" && handleSalvarModal()}
                  />
                </div>
              </div>
              <div className="mp-modal-foot">
                <button className="mp-modal-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button
                  className="mp-modal-ok"
                  onClick={handleSalvarModal}
                  disabled={!formValido()}
                >
                  Adicionar ao bilhete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

/* ── Sub-componentes ─────────────────────────────────────────────────────────── */

function Stat({ label, val, color }) {
  return (
    <div className="mp-stat">
      <span className="mp-stat-label">{label}</span>
      <span className="mp-stat-val" style={color ? { color } : {}}>{val}</span>
    </div>
  );
}

function MoneyInput({ placeholder, value, prefix, prefixColor, onChange }) {
  return (
    <div className="mp-money-bar">
      <span className="mp-money-bar-pre" style={{ color: prefixColor }}>{prefix}</span>
      <input
        type="number" inputMode="decimal"
        className="mp-money-bar-input"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function ResultBlock({ resultado, accessGranted, isMultipla, selecoes, cOdd, cChance, session, saved, onSalvar, onNova }) {
  const rc = riskColor(resultado.nivelRisco);
  if (!resultado.isPaid && !accessGranted) {
    return (
      <div className="mp-lock">
        <div className="mp-lock-hd">
          <span className="mp-lock-dot" />
          <span className="mp-lock-lbl">Risco identificado</span>
        </div>
        <p className="mp-lock-msg">{resultado.mensagem}</p>
        <div className="mp-lock-chips">
          {(resultado.alertas || []).map((a, i) => <div key={i} className="mp-chip">{a}</div>)}
        </div>
        <div className="mp-lock-cta-box">
          <p className="mp-lock-cta-t">Análise incompleta.</p>
          <p className="mp-lock-cta-s">O MotorIA identificou padrões de risco. Desbloqueie para ver a análise completa.</p>
          <a href="https://pay.kiwify.com.br/DIVD8zl" target="_blank" rel="noopener noreferrer" className="mp-unlock">
            Desbloquear análise completa
          </a>
          <p className="mp-lock-price">Pagamento único · sem mensalidade · R$27</p>
        </div>
      </div>
    );
  }
  return (
    <div className="mp-result">
      <div className="mp-res-risk" style={{ borderColor: `${rc}30` }}>
        <div>
          <div className="mp-res-lbl">{isMultipla ? "RISCO DO BILHETE" : "RISCO DA ENTRADA"}</div>
          <div className="mp-res-val" style={{ color: rc }}>{(resultado.nivelRisco || "").toUpperCase()}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="mp-res-lbl">CHANCE REAL</div>
          <div className="mp-res-val" style={{ color: cChance }}>{resultado.chanceReal}%</div>
        </div>
      </div>

      <div className="mp-res-grid">
        <Card label={isMultipla ? "ODD TOTAL" : "ODD"} val={resultado.oddTotal} color={cOdd} />
        {isMultipla && <Card label="SELEÇÕES" val={selecoes.length} />}
        {resultado.retornoPossivel && <Card label="RETORNO" val={`R$${resultado.retornoPossivel}`} color="#22c55e" />}
        {resultado.percentualBanca && (
          <Card label="% DA BANCA" val={`${resultado.percentualBanca}%`}
            color={parseFloat(resultado.percentualBanca) > 5 ? "#FF4D2E" : "#FFB020"} />
        )}
      </div>

      {resultado.mensagem && <p className="mp-res-msg">{resultado.mensagem}</p>}

      {resultado.dependencias && (
        <div className="mp-res-card mp-card-red">
          <div className="mp-res-lbl" style={{ color: "#FF4D2E" }}>DEPENDÊNCIAS</div>
          <p className="mp-card-txt">{resultado.dependencias}</p>
        </div>
      )}

      {resultado.riscoPrincipal && (
        <div className="mp-res-card">
          <div className="mp-res-lbl">RISCO PRINCIPAL</div>
          <p className="mp-card-txt">{resultado.riscoPrincipal}</p>
        </div>
      )}

      {resultado.errado?.length > 0 && (
        <div className="mp-res-card mp-card-red">
          <div className="mp-res-lbl">O QUE PODE DAR ERRADO</div>
          <ul className="mp-bullets">
            {resultado.errado.map((b, i) => <li key={i} className="mp-bullet">{b}</li>)}
          </ul>
        </div>
      )}

      {resultado.alertaBanca && (
        <div className="mp-alert-red">{resultado.alertaBanca}</div>
      )}

      {resultado.alertaAcumulado && isMultipla && (
        <div className="mp-alert-amber">
          <span>⚡</span> {resultado.alertaAcumulado}
        </div>
      )}

      {resultado.leituraFinal && (
        <div className="mp-res-card">
          <div className="mp-res-lbl">LEITURA FINAL</div>
          <p className="mp-card-txt">{resultado.leituraFinal}</p>
        </div>
      )}

      <div className="mp-res-actions">
        {session && !saved && (
          <button className="mp-save-btn" onClick={onSalvar}>Salvar no histórico</button>
        )}
        {saved && <span className="mp-saved">✓ Salvo</span>}
        <button className="mp-reset-btn" onClick={onNova}>← Nova análise</button>
      </div>
    </div>
  );
}

function Card({ label, val, color }) {
  return (
    <div className="mp-res-card mp-res-card-sm">
      <div className="mp-res-lbl">{label}</div>
      <div className="mp-res-val" style={color ? { color } : {}}>{val}</div>
    </div>
  );
}

function HistoricoBlock({ session, histLoading, historico, updatingId, onTab, onMarca, onExclui }) {
  if (!session) return (
    <div className="mp-hist-empty">
      <p>Faça login para ver seu histórico.</p>
      <a href="/login" className="mp-unlock" style={{ textDecoration: "none" }}>Entrar</a>
    </div>
  );
  if (histLoading) return <div className="mp-hist-empty">Carregando…</div>;
  if (historico.length === 0) return (
    <div className="mp-hist-empty">
      <p>Nenhum bilhete salvo ainda.</p>
      <button className="mp-modal-cancel" onClick={onTab}>Analisar bilhete →</button>
    </div>
  );
  return (
    <div className="mp-hist">
      {historico.map(slip => (
        <div key={slip.id} className="mp-hist-card">
          <div className="mp-hist-top">
            <div>
              <span className="mp-hist-risk" style={{ color: riskColor(slip.riskLevel) }}>
                {(slip.riskLevel || "—").toUpperCase()}
              </span>
              <span className="mp-hist-date">{fmtDate(slip.createdAt)}</span>
            </div>
            <button className="mp-hist-del" onClick={() => onExclui(slip.id)} aria-label="Excluir">
              <IconX size={13} />
            </button>
          </div>
          <div className="mp-hist-metrics">
            <span>Odd <strong style={{ color: slip.oddTotal < 3 ? "#22c55e" : slip.oddTotal < 6 ? "#FFB020" : "#FF4D2E" }}>
              {parseFloat(slip.oddTotal).toFixed(2)}
            </strong></span>
            <span>Chance <strong style={{ color: slip.chanceReal < 20 ? "#FF4D2E" : "#FFB020" }}>
              {parseFloat(slip.chanceReal).toFixed(1)}%
            </strong></span>
            {slip.stake && <span>Valor <strong>R${parseFloat(slip.stake).toFixed(2)}</strong></span>}
            <span>{slip.selecoes?.length || 0} sel.</span>
          </div>
          {slip.selecoes?.length > 0 && (
            <div className="mp-hist-sels">
              {slip.selecoes.map((s, i) => (
                <div key={i} className="mp-hist-sel">
                  <span className="mp-hist-jogo">{s.jogo}</span>
                  <span className="mp-hist-odd">Odd {parseFloat(s.odd).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mp-hist-res-row">
            <span className="mp-hist-res-lbl">Resultado:</span>
            <div className="mp-hist-btns">
              {["pendente", "ganhou", "perdeu"].map(opt => (
                <button
                  key={opt}
                  disabled={updatingId === slip.id}
                  onClick={() => onMarca(slip.id, opt)}
                  className={`mp-hist-btn mp-hist-${opt}${slip.resultado === opt ? " mp-hist-active" : ""}`}
                >
                  {opt === "pendente" ? "Pendente" : opt === "ganhou" ? "Ganhou" : "Perdeu"}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── CSS ─────────────────────────────────────────────────────────────────────── */
const CSS = `
.mp-root { font-family: 'Inter', sans-serif; min-height: 80vh; }
.mp-page { max-width: 560px; margin: 0 auto; padding: 20px 20px 40px; display: flex; flex-direction: column; gap: 16px; }

/* Tabs */
.mp-tabs { display: flex; gap: 4px; background: #111112; border: 1px solid #1E1E1F; border-radius: 12px; padding: 4px; }
.mp-tab { flex: 1; padding: 10px; background: transparent; border: none; border-radius: 8px; color: #555; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px; }
.mp-tab:hover:not(:disabled) { color: #aaa; }
.mp-tab:disabled { opacity: 0.4; cursor: not-allowed; }
.mp-tab-active { background: #1A1A1D !important; color: #F2F2F0 !important; }
.mp-tab-count { background: rgba(34,197,94,0.14); color: #22c55e; border-radius: 20px; font-size: 11px; font-weight: 700; padding: 1px 7px; }

/* ── Fase 0: formulário ─────────────────────────────────── */
.mp-form { display: flex; flex-direction: column; gap: 14px; }
.mp-form-head { padding-bottom: 2px; }
.mp-form-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 900; color: #F2F2F0; margin: 0 0 4px; letter-spacing: -0.02em; }
.mp-form-sub { font-size: 14px; color: #555; margin: 0; }

.mp-field { display: flex; flex-direction: column; gap: 7px; }
.mp-label { font-size: 10px; font-weight: 700; color: #444; letter-spacing: 0.1em; text-transform: uppercase; }
.mp-opt { font-weight: 400; color: #2A2A2E; text-transform: none; letter-spacing: 0; }
.mp-input { background: #111112; border: 1px solid #1E1E1F; border-radius: 12px; color: #F2F2F0; font-size: 16px; font-family: inherit; padding: 14px 16px; outline: none; width: 100%; box-sizing: border-box; -webkit-appearance: none; appearance: none; transition: border-color 0.18s; }
.mp-input:focus { border-color: rgba(34,197,94,0.4); }
.mp-input::placeholder { color: rgba(255,255,255,.22); }
.mp-select { cursor: pointer; }
.mp-odd-input { font-size: 22px; font-weight: 800; letter-spacing: 0.02em; }

.mp-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.mp-money-wrap { display: flex; align-items: center; background: #111112; border: 1px solid #1E1E1F; border-radius: 12px; overflow: hidden; transition: border-color 0.15s; }
.mp-money-wrap:focus-within { border-color: rgba(34,197,94,0.35); }
.mp-money-pre { padding: 0 4px 0 14px; font-size: 15px; font-weight: 700; color: #22c55e; flex-shrink: 0; }
.mp-money-input { flex: 1; background: transparent; border: none; outline: none; color: #F2F2F0; font-size: 16px; font-weight: 600; font-family: inherit; padding: 14px 12px 14px 0; -webkit-appearance: none; appearance: none; min-width: 0; }
.mp-money-input::placeholder { color: rgba(255,255,255,.22); }

/* CTAs fase 0 */
.mp-cta-primary { width: 100%; padding: 16px; background: #22c55e; border: none; border-radius: 12px; color: #000; font-size: 16px; font-weight: 900; font-family: inherit; cursor: pointer; transition: opacity 0.15s; margin-top: 2px; }
.mp-cta-primary:hover:not(:disabled) { opacity: 0.88; }
.mp-cta-primary:disabled { opacity: 0.3; cursor: not-allowed; }

.mp-multi-invite { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; background: #111112; border: 1px solid #1E1E1F; border-radius: 12px; }
.mp-multi-invite-label { font-size: 13px; font-weight: 600; color: #888; }
.mp-cta-multi { background: rgba(34,197,94,0.09); border: 1px solid rgba(34,197,94,0.25); color: #22c55e; font-size: 13px; font-weight: 700; font-family: inherit; padding: 9px 14px; border-radius: 9px; cursor: pointer; transition: all 0.15s; white-space: nowrap; flex-shrink: 0; }
.mp-cta-multi:hover:not(:disabled) { background: rgba(34,197,94,0.15); border-color: rgba(34,197,94,0.45); }
.mp-cta-multi:disabled { opacity: 0.3; cursor: not-allowed; }

/* ── Fase 1+: cards ──────────────────────────────────────── */
.mp-selecoes { display: flex; flex-direction: column; gap: 10px; }
.mp-sel-head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 2px; }
.mp-multi-badge { font-size: 11px; font-weight: 700; color: #22c55e; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); border-radius: 20px; padding: 3px 10px; }

.mp-sel-card { display: flex; align-items: center; gap: 12px; background: #111112; border: 1px solid #1E1E1F; border-radius: 14px; padding: 14px 16px; transition: border-color 0.15s; }
.mp-sel-card:hover { border-color: #2A2A2E; }
.mp-sel-num { width: 28px; height: 28px; border-radius: 50%; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.22); color: #22c55e; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mp-sel-body { flex: 1; min-width: 0; }
.mp-sel-jogo { font-size: 14px; font-weight: 700; color: #F2F2F0; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mp-sel-row { display: flex; align-items: center; gap: 8px; }
.mp-sel-mercado { font-size: 12px; color: #555; }
.mp-sel-chip { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.18); color: #22c55e; font-size: 13px; font-weight: 800; border-radius: 6px; padding: 2px 9px; }
.mp-sel-obs { font-size: 11px; color: #3A3A3E; margin-top: 4px; font-style: italic; }
.mp-sel-rm { background: none; border: none; color: #2A2A2E; cursor: pointer; padding: 6px; border-radius: 6px; display: flex; align-items: center; transition: color 0.15s, background 0.15s; flex-shrink: 0; }
.mp-sel-rm:hover { color: #FF4D2E; background: rgba(255,77,46,0.07); }

/* Convite múltipla (fase 1) */
.mp-invite-btn { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; background: #111112; border: 1px solid #1E1E1F; border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: border-color 0.15s; text-align: left; font-family: inherit; }
.mp-invite-btn:hover { border-color: rgba(34,197,94,0.3); }
.mp-invite-q { font-size: 13px; font-weight: 600; color: #888; }
.mp-invite-cta { font-size: 13px; font-weight: 700; color: #22c55e; white-space: nowrap; flex-shrink: 0; }

/* Dependência + add more (fase 2+) */
.mp-dep-alert { display: flex; align-items: flex-start; gap: 10px; background: rgba(255,77,46,0.05); border: 1px solid rgba(255,77,46,0.14); border-radius: 10px; padding: 11px 14px; font-size: 13px; color: #999; line-height: 1.5; }
.mp-dep-dot { width: 6px; height: 6px; border-radius: 50%; background: #FF4D2E; flex-shrink: 0; margin-top: 4px; }
.mp-dep-alert strong { color: #FF4D2E; font-weight: 700; }
.mp-add-more { width: 100%; padding: 13px; background: transparent; border: 1px dashed rgba(34,197,94,0.25); border-radius: 12px; color: #22c55e; font-weight: 700; font-size: 14px; font-family: inherit; cursor: pointer; transition: all 0.15s; }
.mp-add-more:hover { background: rgba(34,197,94,0.04); border-color: rgba(34,197,94,0.45); }

/* Error / Loading */
.mp-err { background: rgba(255,77,46,0.07); border: 1px solid rgba(255,77,46,0.18); border-radius: 10px; color: #f87171; font-size: 14px; padding: 12px 14px; }
.mp-loading { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 40px 0; }
.mp-spinner { width: 36px; height: 36px; border: 2px solid #1E1E1F; border-top-color: #22c55e; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.mp-loading p { font-size: 14px; color: #555; }

/* ── Sticky bar ────────────────────────────────────────── */
.mp-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; background: rgba(10,10,11,0.97); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-top: 1px solid #1A1A1D; padding-bottom: env(safe-area-inset-bottom, 0px); }
.mp-bar-inner { max-width: 560px; margin: 0 auto; padding: 12px 20px 16px; display: flex; flex-direction: column; gap: 10px; }

.mp-bar-stats { display: flex; gap: 14px; flex-wrap: wrap; }
.mp-stat { display: flex; flex-direction: column; gap: 1px; }
.mp-stat-label { font-size: 9px; font-weight: 700; color: #444; letter-spacing: 0.1em; text-transform: uppercase; }
.mp-stat-val { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 900; color: #F2F2F0; font-variant-numeric: tabular-nums; line-height: 1.1; }

.mp-bar-inputs { display: flex; gap: 8px; }
.mp-money-bar { flex: 1; display: flex; align-items: center; background: #111112; border: 1px solid #1E1E1F; border-radius: 10px; overflow: hidden; transition: border-color 0.15s; }
.mp-money-bar:focus-within { border-color: rgba(34,197,94,.35); }
.mp-money-bar-pre { padding: 0 4px 0 12px; font-size: 14px; font-weight: 700; flex-shrink: 0; }
.mp-money-bar-input { flex: 1; background: transparent; border: none; outline: none; color: #F2F2F0; font-size: 15px; font-weight: 600; font-family: inherit; padding: 11px 10px 11px 2px; -webkit-appearance: none; appearance: none; min-width: 0; }
.mp-money-bar-input::placeholder { color: rgba(255,255,255,.22); }

.mp-bar-preview { display: flex; align-items: center; gap: 8px; }
.mp-bar-prev-jogo { font-size: 13px; color: #888; font-weight: 600; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mp-bar-prev-odd { font-size: 13px; font-weight: 800; flex-shrink: 0; }
.mp-bar-prev-ret { font-size: 13px; color: #22c55e; font-weight: 700; flex-shrink: 0; }

.mp-bar-cta { width: 100%; padding: 15px; background: #22c55e; border: none; border-radius: 12px; color: #000; font-weight: 900; font-size: 15px; font-family: inherit; cursor: pointer; transition: opacity 0.15s; }
.mp-bar-cta:hover { opacity: 0.88; }

/* ── Modal ─────────────────────────────────────────────── */
.mp-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.75); display: flex; align-items: flex-end; justify-content: center; }
.mp-modal { width: 100%; max-width: 560px; max-height: 92vh; overflow-y: auto; background: #0E0E11; border: 1px solid #1E1E1F; border-radius: 20px 20px 0 0; display: flex; flex-direction: column; animation: slideUp 0.22s ease; }
@keyframes slideUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@media (min-width: 600px) {
  .mp-overlay { align-items: center; }
  .mp-modal { border-radius: 20px; max-width: 420px; }
}
.mp-modal-handle { width: 36px; height: 4px; background: #2A2A2E; border-radius: 4px; margin: 12px auto 4px; flex-shrink: 0; }
@media (min-width: 600px) { .mp-modal-handle { display: none; } }
.mp-modal-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px 8px; flex-shrink: 0; }
.mp-modal-title { font-size: 16px; font-weight: 800; color: #F2F2F0; }
.mp-modal-x { background: none; border: none; color: #444; cursor: pointer; padding: 6px; border-radius: 6px; display: flex; align-items: center; transition: color 0.15s; }
.mp-modal-x:hover { color: #888; }
.mp-modal-body { padding: 8px 20px 4px; display: flex; flex-direction: column; gap: 14px; flex: 1; }
.mp-modal-foot { display: flex; gap: 10px; padding: 16px 20px; flex-shrink: 0; padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px)); }
.mp-modal-cancel { flex: 1; padding: 14px; background: transparent; border: 1px solid #1E1E1F; border-radius: 10px; color: #555; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.15s; }
.mp-modal-cancel:hover { border-color: #444; color: #888; }
.mp-modal-ok { flex: 2; padding: 14px; background: #22c55e; border: none; border-radius: 10px; color: #000; font-size: 15px; font-weight: 900; font-family: inherit; cursor: pointer; transition: opacity 0.15s; }
.mp-modal-ok:hover:not(:disabled) { opacity: 0.88; }
.mp-modal-ok:disabled { opacity: 0.3; cursor: not-allowed; }

/* ── Resultado ─────────────────────────────────────────── */
.mp-result { display: flex; flex-direction: column; gap: 12px; }
.mp-lock { background: #111112; border: 1px solid #1E1E1F; border-radius: 14px; padding: 22px; display: flex; flex-direction: column; gap: 14px; }
.mp-lock-hd { display: flex; align-items: center; gap: 8px; }
.mp-lock-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: pulse 2s infinite; flex-shrink: 0; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
.mp-lock-lbl { font-size: 12px; font-weight: 700; color: #22c55e; letter-spacing: 0.07em; text-transform: uppercase; }
.mp-lock-msg { font-size: 15px; color: #aaa; line-height: 1.6; margin: 0; }
.mp-lock-chips { display: flex; flex-direction: column; gap: 8px; }
.mp-chip { background: rgba(34,197,94,0.05); border: 1px solid rgba(34,197,94,0.12); border-radius: 8px; padding: 9px 13px; font-size: 13px; color: #ccc; }
.mp-lock-cta-box { background: #0D0D0F; border: 1px solid rgba(34,197,94,0.1); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
.mp-lock-cta-t { font-weight: 700; font-size: 15px; color: #F2F2F0; margin: 0; }
.mp-lock-cta-s { font-size: 13px; color: #666; margin: 0; line-height: 1.5; }
.mp-unlock { display: block; text-align: center; padding: 15px; background: #22c55e; color: #000; font-size: 14px; font-weight: 900; border-radius: 10px; text-decoration: none; transition: opacity 0.15s; }
.mp-unlock:hover { opacity: 0.88; }
.mp-lock-price { font-size: 11px; color: #3A3A3E; text-align: center; margin: 0; }

.mp-res-risk { border: 1px solid; border-radius: 12px; padding: 18px; display: flex; justify-content: space-between; align-items: flex-start; }
.mp-res-lbl { font-size: 9px; font-weight: 700; color: #444; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
.mp-res-val { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 900; color: #F2F2F0; }
.mp-res-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.mp-res-card { background: #111112; border: 1px solid #1E1E1F; border-radius: 12px; padding: 16px; }
.mp-res-card-sm .mp-res-val { font-size: 24px; }
.mp-card-red { border-color: rgba(255,77,46,0.14); background: rgba(255,77,46,0.03); }
.mp-card-red .mp-res-lbl { color: #FF4D2E; }
.mp-card-txt { font-size: 14px; color: #bbb; line-height: 1.7; margin: 0; }
.mp-res-msg { font-size: 15px; color: #bbb; line-height: 1.7; }
.mp-bullets { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.mp-bullet { font-size: 14px; color: #bbb; padding-left: 18px; position: relative; line-height: 1.6; }
.mp-bullet::before { content: "—"; position: absolute; left: 0; color: #FF4D2E; font-weight: 700; }
.mp-alert-red { background: rgba(255,77,46,0.07); border: 1px solid rgba(255,77,46,0.18); border-radius: 10px; padding: 13px 15px; font-size: 14px; color: #FF4D2E; line-height: 1.6; }
.mp-alert-amber { display: flex; gap: 8px; background: rgba(255,176,32,0.06); border: 1px solid rgba(255,176,32,0.16); border-radius: 10px; padding: 12px 14px; font-size: 13px; color: #C9a227; line-height: 1.55; }
.mp-res-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.mp-save-btn { padding: 10px 18px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 8px; color: #22c55e; font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer; transition: all 0.15s; }
.mp-save-btn:hover { background: rgba(34,197,94,0.14); }
.mp-saved { font-size: 13px; color: #22c55e; font-weight: 700; }
.mp-reset-btn { background: none; border: 1px solid #1E1E1F; border-radius: 8px; color: #444; font-size: 13px; font-family: inherit; padding: 9px 14px; cursor: pointer; transition: all 0.15s; }
.mp-reset-btn:hover { border-color: #444; color: #888; }

/* ── Histórico ─────────────────────────────────────────── */
.mp-hist { display: flex; flex-direction: column; gap: 12px; }
.mp-hist-empty { text-align: center; padding: 48px 20px; color: #555; font-size: 14px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.mp-hist-card { background: #111112; border: 1px solid #1E1E1F; border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.mp-hist-top { display: flex; justify-content: space-between; align-items: flex-start; }
.mp-hist-risk { font-size: 13px; font-weight: 800; display: block; margin-bottom: 4px; }
.mp-hist-date { font-size: 11px; color: #444; }
.mp-hist-del { background: none; border: none; color: #2A2A2E; cursor: pointer; padding: 4px; border-radius: 6px; display: flex; align-items: center; transition: color 0.15s; }
.mp-hist-del:hover { color: #FF4D2E; }
.mp-hist-metrics { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12px; color: #666; }
.mp-hist-metrics strong { font-weight: 700; }
.mp-hist-sels { display: flex; flex-direction: column; gap: 6px; }
.mp-hist-sel { display: flex; justify-content: space-between; font-size: 12px; padding: 6px 0; border-bottom: 1px solid #1A1A1D; }
.mp-hist-sel:last-child { border-bottom: none; }
.mp-hist-jogo { color: #aaa; }
.mp-hist-odd { color: #555; }
.mp-hist-res-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding-top: 4px; }
.mp-hist-res-lbl { font-size: 11px; color: #444; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
.mp-hist-btns { display: flex; gap: 6px; }
.mp-hist-btn { padding: 5px 12px; border-radius: 20px; border: 1px solid #1E1E1F; background: transparent; color: #555; font-size: 12px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.15s; }
.mp-hist-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mp-hist-ganhou.mp-hist-active { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.26); color: #22c55e; }
.mp-hist-perdeu.mp-hist-active { background: rgba(255,77,46,0.1); border-color: rgba(255,77,46,0.26); color: #FF4D2E; }
.mp-hist-pendente.mp-hist-active { background: rgba(255,176,32,0.08); border-color: rgba(255,176,32,0.22); color: #FFB020; }

@media (max-width: 420px) {
  .mp-res-grid { grid-template-columns: 1fr; }
  .mp-two-col { grid-template-columns: 1fr; }
  .mp-multi-invite { flex-direction: column; align-items: flex-start; gap: 10px; }
  .mp-cta-multi { width: 100%; text-align: center; }
}
`;
