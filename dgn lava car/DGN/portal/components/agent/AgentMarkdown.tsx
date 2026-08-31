import type { ReactNode } from "react";

// -----------------------------------------------------------------------------
// AgentMarkdown — renderer minimalista e seguro para o texto retornado pelo
// Assistente DGN. NÃO USA `dangerouslySetInnerHTML` em lugar nenhum: cada nó
// vira um elemento React pelo parser.
//
// Suporta:
//   - parágrafo (linhas separadas por \n\n);
//   - listas com `- ` ou `* ` (unordered) e `1.` `2.` (ordered);
//   - títulos leves: `## ` (h3), `### ` (h4);
//   - quote: `> `;
//   - separador `---` (uma <hr /> simples);
//   - inline: **bold**, *italic*, `code`, [texto](url).
//
// Regras de segurança:
//   - links só passam se começam com "http://" ou "https://" (nunca javascript:).
//   - links `[texto](path)` internos (começam com `/`) são reescritos com Link
//     do next/link opcionalmente; nesta versão renderizamos como <a href> plain.
//   - código inline com `<`/`>` é escapado natural pelo React (não vira HTML).
// -----------------------------------------------------------------------------

interface AgentMarkdownProps {
  text: string;
}

interface Block {
  kind: "p" | "h3" | "h4" | "quote" | "ul" | "ol" | "hr";
  lines?: string[];
}

function tokenizeBlocks(source: string): Block[] {
  const normalized = source.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const lines = normalized.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      i += 1;
      continue;
    }

    if (line === "---" || line === "***") {
      blocks.push({ kind: "hr" });
      i += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ kind: "h4", lines: [line.slice(4).trim()] });
      i += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({ kind: "h3", lines: [line.slice(3).trim()] });
      i += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      const quoted: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quoted.push(lines[i].trim().slice(2).trim());
        i += 1;
      }
      blocks.push({ kind: "quote", lines: quoted });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push({ kind: "ul", lines: items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push({ kind: "ol", lines: items });
      continue;
    }

    // Parágrafo — junta linhas contíguas até vazio ou próximo bloco.
    const para: string[] = [line];
    i += 1;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (!next) break;
      if (next === "---" || next === "***") break;
      if (next.startsWith("## ") || next.startsWith("### ")) break;
      if (next.startsWith("> ")) break;
      if (/^[-*]\s+/.test(next)) break;
      if (/^\d+\.\s+/.test(next)) break;
      para.push(next);
      i += 1;
    }
    blocks.push({ kind: "p", lines: para });
  }

  return blocks;
}

// Inline tokenizer — cobre bold, italic, code inline e links, na ordem que
// evita conflito. Sem regex compilada global — fazemos escaneamento manual.
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let buffer = "";
  let i = 0;

  const pushBuffer = () => {
    if (buffer) {
      nodes.push(buffer);
      buffer = "";
    }
  };

  while (i < text.length) {
    const ch = text[i];

    // Escape literal markdown: `\<char>` — remove o backslash e mantém o char.
    // Cobre a lista canônica (`* _ ` [ ] ( ) # + - . ! | > ~ \`) para não
    // vazar `\*` visualmente quando a origem (skill ou LLM) já escapou.
    if (ch === "\\" && i + 1 < text.length) {
      const next = text[i + 1];
      if (/[\\*_`[\]()#+\-.!|>~]/.test(next)) {
        buffer += next;
        i += 2;
        continue;
      }
    }

    // Code inline `code`
    if (ch === "`") {
      const end = text.indexOf("`", i + 1);
      if (end > i + 1) {
        pushBuffer();
        nodes.push(<code key={nodes.length} className="rounded bg-white/[0.08] px-1 text-[0.85em] font-mono text-white/90">{text.slice(i + 1, end)}</code>);
        i = end + 1;
        continue;
      }
    }

    // Sequência de 3+ asteriscos consecutivos → literal (PII mascarada tipo
    // "FYP***3" ou "(19) *****-1234"). Não tenta bold/italic aí.
    if (ch === "*") {
      let asteriskRun = 0;
      while (i + asteriskRun < text.length && text[i + asteriskRun] === "*") asteriskRun += 1;
      if (asteriskRun >= 3) {
        buffer += "*".repeat(asteriskRun);
        i += asteriskRun;
        continue;
      }
    }

    // Bold **text**
    if (ch === "*" && text[i + 1] === "*") {
      const end = text.indexOf("**", i + 2);
      if (end > i + 2 && text[end + 2] !== "*") {
        pushBuffer();
        nodes.push(<strong key={nodes.length} className="font-semibold">{renderInline(text.slice(i + 2, end))}</strong>);
        i = end + 2;
        continue;
      }
    }

    // Italic *text* — exige que o fechamento seja um asterisco isolado (não
    // parte de bold/máscara).
    if (ch === "*") {
      const end = text.indexOf("*", i + 1);
      if (end > i + 1 && text[end + 1] !== "*" && text[i + 1] !== "*") {
        pushBuffer();
        nodes.push(<em key={nodes.length} className="italic">{renderInline(text.slice(i + 1, end))}</em>);
        i = end + 1;
        continue;
      }
    }

    // Link [text](url)
    if (ch === "[") {
      const close = text.indexOf("]", i + 1);
      if (close > i + 1 && text[close + 1] === "(") {
        const paren = text.indexOf(")", close + 2);
        if (paren > close + 2) {
          const label = text.slice(i + 1, close);
          const rawUrl = text.slice(close + 2, paren).trim();
          const safeUrl = sanitizeUrl(rawUrl);
          if (safeUrl) {
            pushBuffer();
            nodes.push(
              <a
                key={nodes.length}
                href={safeUrl}
                target={safeUrl.startsWith("/") ? undefined : "_blank"}
                rel={safeUrl.startsWith("/") ? undefined : "noopener noreferrer"}
                className="text-[#E7C96A] underline underline-offset-2 hover:text-[#F1D889]"
              >
                {renderInline(label)}
              </a>,
            );
            i = paren + 1;
            continue;
          }
        }
      }
    }

    buffer += ch;
    i += 1;
  }
  pushBuffer();
  return nodes;
}

function sanitizeUrl(url: string): string | null {
  if (!url) return null;
  // Aceita apenas http(s) absoluto ou caminho interno começando com /.
  if (url.startsWith("/")) return url;
  try {
    const u = new URL(url);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch {
    return null;
  }
  return null;
}

function renderBlock(block: Block, key: number): ReactNode {
  switch (block.kind) {
    case "hr":
      return <hr key={key} className="my-2 border-white/[0.08]" />;
    case "h3":
      return (
        <h3 key={key} className="mt-2 text-sm font-semibold text-white/95">
          {renderInline(block.lines?.[0] ?? "")}
        </h3>
      );
    case "h4":
      return (
        <h4 key={key} className="mt-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
          {renderInline(block.lines?.[0] ?? "")}
        </h4>
      );
    case "quote":
      return (
        <blockquote
          key={key}
          className="border-l-2 border-[#C9A84C]/40 pl-3 text-sm italic text-white/70"
        >
          {(block.lines ?? []).map((line, i) => (
            <p key={i}>{renderInline(line)}</p>
          ))}
        </blockquote>
      );
    case "ul":
      return (
        <ul key={key} className="ml-4 list-disc space-y-1 text-sm text-white/90">
          {(block.lines ?? []).map((line, i) => (
            <li key={i}>{renderInline(line)}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={key} className="ml-4 list-decimal space-y-1 text-sm text-white/90">
          {(block.lines ?? []).map((line, i) => (
            <li key={i}>{renderInline(line)}</li>
          ))}
        </ol>
      );
    case "p":
    default:
      return (
        <p key={key} className="text-sm leading-relaxed text-white/90">
          {(block.lines ?? []).map((line, i) => (
            <span key={i}>
              {renderInline(line)}
              {i < (block.lines?.length ?? 0) - 1 ? " " : null}
            </span>
          ))}
        </p>
      );
  }
}

export function AgentMarkdown({ text }: AgentMarkdownProps) {
  const blocks = tokenizeBlocks(text);
  if (blocks.length === 0) return null;
  return (
    <div className="flex flex-col gap-2" data-testid="agent-markdown">
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}
