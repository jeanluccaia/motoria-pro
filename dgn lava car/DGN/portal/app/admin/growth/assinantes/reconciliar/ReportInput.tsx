"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";

export function ReportInput({ text, onChange, onAnalyze, loading, disabled }: {
  text: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = disabled || loading || reading;

  async function readFile(file: File) {
    setReading(true);
    setError(null);
    setFileName("");
    onChange("");
    try {
      const content = await file.text();
      if (!content.trim()) throw new Error("O arquivo está vazio. Selecione outro relatório.");
      if (content.includes("\u0000") || content.includes("\ufffd")) throw new Error("Não foi possível ler o arquivo. Salve o relatório como CSV ou TSV em UTF-8.");
      onChange(content);
      setFileName(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível ler o arquivo.");
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return <section className="dgn-report-input" aria-labelledby="report-heading">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="report-heading" className="text-sm font-semibold">Relatório de assinaturas</h2>
      <div className="dgn-input-switch" role="group" aria-label="Origem do relatório">
        <button type="button" aria-pressed={mode === "file"} disabled={busy} onClick={() => { setMode("file"); setError(null); }}>Arquivo</button>
        <button type="button" aria-pressed={mode === "paste"} disabled={busy} onClick={() => { setMode("paste"); setError(null); }}>Colar dados</button>
      </div>
    </div>

    {mode === "file" ? <div className="dgn-file-picker">
      <FileSpreadsheet size={24} className="shrink-0 text-[#c9a84c]" />
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm text-white/85">{fileName || (text.trim() ? "Dados colados prontos para análise" : "Selecione um relatório")}</p>
        <p className="mt-1 text-xs text-white/50">CSV ou TSV · a análise não altera assinaturas.</p>
      </div>
      <button type="button" className="dgn-button" disabled={busy} onClick={() => inputRef.current?.click()}>{reading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}{fileName ? "Trocar arquivo" : "Selecionar arquivo"}</button>
      <input ref={inputRef} type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" aria-label="Selecionar relatório CSV ou TSV" className="sr-only" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) void readFile(file); }} />
    </div> : <label className="mt-4 flex flex-col gap-2">
      <span className="text-xs text-white/60">Dados da planilha</span>
      <textarea value={text} disabled={busy} onChange={e => { onChange(e.target.value); setFileName(""); setError(null); }} rows={5} placeholder="Cole os cabeçalhos e as linhas do relatório." className="w-full resize-y rounded-lg border border-white/10 bg-[#0a0a0b] p-3 text-sm text-white/85 outline-none focus:border-[#c9a84c]/50" />
    </label>}
    {error ? <p role="alert" className="mt-3 text-xs text-amber-200">{error}</p> : null}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <details className="max-w-lg text-xs text-white/50">
        <summary className="inline-flex min-h-11 cursor-pointer items-center">Quais colunas posso usar?</summary>
        <p className="pb-3 leading-relaxed">Nome, telefone, placa, plano, situação, vigência, modalidade, pagamento, observações e origem. Mantenha os cabeçalhos na primeira linha. Os nomes equivalentes em inglês também são aceitos.</p>
      </details>
      <button type="button" className="dgn-button dgn-button-primary" disabled={busy || !text.trim()} onClick={onAnalyze}>{loading ? <Loader2 size={15} className="animate-spin" /> : null}{loading ? "Analisando…" : "Analisar relatório"}</button>
    </div>
  </section>;
}
