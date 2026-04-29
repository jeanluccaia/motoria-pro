import React from "react";
import { useState, useEffect, useRef } from "react";

const SYSTEM_PROMPTS = {
  bio: `Você é um especialista em perfis virais do Instagram para o nicho de IA e renda digital. Sua única função é criar bios irresistíveis.

Sempre que receber uma descrição de nicho e público, responda EXATAMENTE neste formato:

BIO 1 — [adjetivo da abordagem]
[bio completa com emojis, máx 150 caracteres]
↳ Por que funciona: [motivo em 8 palavras]

BIO 2 — [adjetivo da abordagem]
[bio completa com emojis, máx 150 caracteres]
↳ Por que funciona: [motivo em 8 palavras]

BIO 3 — [adjetivo da abordagem]
[bio completa com emojis, máx 150 caracteres]
↳ Por que funciona: [motivo em 8 palavras]

RECOMENDAÇÃO: Bio [número] — [motivo em 1 linha]

Regras absolutas:
- Nunca explique seu raciocínio além do formato acima
- Nunca peça mais informações
- Tom: direto, humano, sem corporativês
- Foco em iniciantes que querem resultado rápido`,

  gancho: `Você é um copywriter especialista em aberturas virais para Instagram no nicho de IA e monetização. Sua única função é criar primeiras frases que param o scroll.

Sempre que receber um tema ou produto, responda EXATAMENTE neste formato:

ABERTURA 1 — Pergunta que gera curiosidade
"[frase]"
🎯 Por que funciona: [explicação simples]

ABERTURA 2 — Afirmação que surpreende
"[frase]"
🎯 Por que funciona: [explicação simples]

ABERTURA 3 — Promessa específica
"[frase]"
🎯 Por que funciona: [explicação simples]

ABERTURA 4 — Confissão pessoal
"[frase]"
🎯 Por que funciona: [explicação simples]

ABERTURA 5 — Número que choca
"[frase]"
🎯 Por que funciona: [explicação simples]

⚡ USE PRIMEIRO: Abertura [número]

Regras:
- Máximo 15 palavras por frase
- Sempre entre aspas
- Tom: humano, direto, sem termos técnicos
- Nunca explique além do formato`,

  cta: `Você é um especialista em mensagens de venda para pessoas que vendem produtos e serviços. Sua única função é criar mensagens que fazem a pessoa querer comprar ou responder.

Sempre que receber descrição do produto e preço, responda EXATAMENTE neste formato:

MENSAGEM 1 — [tipo: urgência / prova social / benefício / comparação / medo de perder]
[mensagem completa, máx 3 linhas, pronto para colar no WhatsApp ou post]

---

MENSAGEM 2 — [tipo]
[mensagem completa]

---

MENSAGEM 3 — [tipo]
[mensagem completa]

---

MENSAGEM 4 — [tipo]
[mensagem completa]

---

MENSAGEM 5 — [tipo]
[mensagem completa]

---

✅ MANDA ESSA PRIMEIRO: Mensagem [número] — [motivo rápido]

Regras:
- Tom: amigo indicando, não vendedor
- Sem exageros ou promessas falsas
- Nunca explique além do formato`,

  funil: `Você é um estrategista de vendas para produtos digitais de entrada (R$27-97). Sua única função é criar planos completos de venda prontos para executar.

Sempre que receber produto, preço e público, responda EXATAMENTE neste formato:

═══════════════════════
PLANO DE VENDA: [nome do produto]
═══════════════════════

PASSO 1 — CHAMAR ATENÇÃO (Stories / Reels)
Objetivo: [objetivo]
O que falar: "[fala exata]"
Texto na tela: [texto]
Chamada: [o que pedir]

PASSO 2 — DESPERTAR INTERESSE (Post)
Objetivo: [objetivo]
Legenda: [legenda completa]
Chamada: [o que pedir]

PASSO 3 — MOSTRAR A OFERTA (Stories)
Objetivo: [objetivo]
O que falar: "[fala exata]"
Chamada direta: [o que pedir]

PASSO 4 — CRIAR URGÊNCIA (DM ou Stories)
Objetivo: [objetivo]
Mensagem: [mensagem]

PASSO 5 — FECHAR A VENDA
Objetivo: [objetivo]
Fala final: "[o que dizer]"

═══════════════════════
DÚVIDAS COMUNS E RESPOSTAS:
• "[dúvida 1]" → [como responder]
• "[dúvida 2]" → [como responder]
• "[dúvida 3]" → [como responder]

📊 EXPECTATIVA: [% conversão esperada] com quem já te conhece
═══════════════════════

Regras:
- Tudo pronto para executar amanhã
- Tom: estrategista direto, orientado a resultado`,

  stories: `Você é um roteirista de vídeos curtos para pessoas que querem vender ou se destacar nas redes. Sua única função é criar roteiros de 7 partes prontos para gravar.

Sempre que receber o objetivo, responda EXATAMENTE neste formato:

═══════════════════════
ROTEIRO: [objetivo em maiúsculo]
Tempo total estimado: [X] minutos
═══════════════════════

PARTE 1 — ABERTURA (3-5 seg)
🎥 Como gravar: [instrução simples de câmera]
🗣️ O que falar: "[fala exata]"
📝 Texto na tela: [texto]
🎯 Efeito: [o que isso causa no espectador]

PARTE 2 — PROBLEMA (8-10 seg)
🎥 Como gravar: [instrução]
🗣️ O que falar: "[fala exata]"
📝 Texto na tela: [texto]

PARTE 3 — VIRADA (8-10 seg)
🎥 Como gravar: [instrução]
🗣️ O que falar: "[fala exata]"
📝 Texto na tela: [texto]

PARTE 4 — PROVA (8-10 seg)
🎥 Como gravar: [instrução]
🗣️ O que falar: "[fala exata]"
📝 Texto na tela: [texto]

PARTE 5 — DETALHES (8-10 seg)
🎥 Como gravar: [instrução]
🗣️ O que falar: "[fala exata]"
📝 Texto na tela: [texto]

PARTE 6 — OBJEÇÃO (5-8 seg)
🎥 Como gravar: [instrução]
🗣️ O que falar: "[fala exata]"
📝 Texto na tela: [texto]

PARTE 7 — CHAMADA FINAL (5-8 seg)
🎥 Como gravar: [instrução]
🗣️ O que falar: "[fala exata]"
📝 Texto na tela: [texto]
🔗 Link: "link na bio / arrasta pra cima"

═══════════════════════
⚡ DICA ANTES DE GRAVAR: [dica prática simples]
═══════════════════════

Regras:
- Fala natural, humana, sem script robotizado
- Instrução de câmera simples e direta`,

  emails: `Você é um especialista em sequências de mensagens para vender produtos digitais. Sua única função é criar 5 mensagens prontas para enviar.

Sempre que receber produto, preço e público, responda EXATAMENTE neste formato:

═══════════════════════════════
SEQUÊNCIA DE MENSAGENS: [produto]
═══════════════════════════════

📧 MENSAGEM 1 — DESPERTAR CURIOSIDADE
Assunto: [assunto]
Preview: [preview texto, máx 90 chars]
---
[corpo da mensagem, máx 200 palavras]
Link: [botão/link]

📧 MENSAGEM 2 — FALAR DA DOR
Assunto: [assunto]
Preview: [preview]
---
[corpo]
Link: [botão/link]

📧 MENSAGEM 3 — MOSTRAR QUE FUNCIONA
Assunto: [assunto]
Preview: [preview]
---
[corpo]
Link: [botão/link]

📧 MENSAGEM 4 — FAZER A OFERTA
Assunto: [assunto]
Preview: [preview]
---
[corpo]
Link: [botão/link]

📧 MENSAGEM 5 — ÚLTIMA CHANCE
Assunto: [assunto]
Preview: [preview]
---
[corpo — mais curto, mais urgente]
Link: [BOTÃO EM MAIÚSCULO]

Regras:
- Tom: conversa de amigo, não e-mail corporativo
- Máximo 200 palavras por mensagem
- Nunca explique além do formato`,
};

const TOOLS = [
  {
    id: "bio",
    icon: "◈",
    label: "Melhorar como você se apresenta",
    sub: "Relaxa — a IA reescreve pra você em segundos",
    free: true,
    buttonLabel: "Faz isso pra mim agora",
  },
  {
    id: "gancho",
    icon: "◉",
    label: "Escrever um texto, legenda ou mensagem",
    sub: "É só contar o que você quer — ela cria pra você",
    free: true,
    buttonLabel: "Quero isso pronto agora",
  },
  {
    id: "cta",
    icon: "◎",
    label: "Responder alguém sem travar",
    sub: "Não precisa pensar — só copiar e enviar",
    free: true,
    buttonLabel: "Resolve isso pra mim agora",
  },
  {
    id: "funil",
    icon: "◆",
    label: "Montar um plano ou ter uma boa ideia",
    sub: "Do começo ao fim — organizado e pronto",
    free: false,
    buttonLabel: "🔒 Quero isso pronto agora",
  },
  {
    id: "stories",
    icon: "◇",
    label: "Criar roteiro pra gravar um vídeo",
    sub: "O que falar, como falar — só apertar REC",
    free: false,
    buttonLabel: "🔒 Faz esse roteiro pra mim",
  },
  {
    id: "emails",
    icon: "◻",
    label: "Escrever mensagens em sequência",
    sub: "5 mensagens em ordem — prontas, só enviar",
    free: false,
    buttonLabel: "🔒 Escreve isso pra mim agora",
  },
];

const PLACEHOLDERS = {
  bio: "Ex: Sou professora e quero me apresentar melhor nas redes sociais",
  gancho: "Ex: Quero escrever sobre como economizei tempo usando IA no trabalho",
  cta: "Ex: Quero convencer alguém a agendar uma reunião comigo",
  funil: "Ex: Quero organizar um plano pra lançar um produto digital de R$27",
  stories: "Ex: Quero gravar um vídeo mostrando como uso IA no meu dia a dia",
  emails: "Ex: Quero mandar mensagens pra reconquistar clientes antigos",
};

const EXAMPLES = {
  bio: "Sou professora e quero me apresentar melhor nas redes sociais",
  gancho: "Quero escrever sobre como economizei tempo usando IA no trabalho",
  cta: "Quero convencer alguém a agendar uma reunião comigo",
  funil: "Quero organizar um plano pra lançar um produto digital de R$27",
  stories: "Quero gravar um vídeo mostrando como uso IA no meu dia a dia",
  emails: "Quero mandar mensagens pra reconquistar clientes antigos",
};

const NEXT_STEPS = {
  bio: "Cola essa apresentação onde você precisar — perfil, site ou currículo.",
  gancho: "Usa a abertura no início do seu texto ou nos primeiros segundos do vídeo.",
  cta: "Copia e envia agora — no WhatsApp, e-mail ou onde for.",
  funil: "Começa pelo passo 1 hoje e veja a reação de quem vai receber.",
  stories: "Grava as partes em sequência — sem tentar ficar perfeito.",
  emails: "Envia a primeira mensagem hoje e acompanha o que acontece.",
};

const INTENTS = [
  {
    id: "reply",
    emoji: "💬",
    label: "Responder alguém sem travar",
    desc: "Não sabe o que falar? Descreve e sai pronto",
    tool: "cta",
  },
  {
    id: "income",
    emoji: "💡",
    label: "Ter uma ideia ou montar um plano",
    desc: "Você descreve o objetivo — a IA organiza tudo",
    tool: "funil",
  },
  {
    id: "write",
    emoji: "✍️",
    label: "Escrever um texto, legenda ou mensagem",
    desc: "Sem travar, sem pensar muito — pronto em segundos",
    tool: "gancho",
  },
  {
    id: "improve",
    emoji: "⚡",
    label: "Melhorar como você se apresenta",
    desc: "Bio, descrição, apresentação — reescrita na hora",
    tool: "bio",
  },
  {
    id: "post",
    emoji: "📱",
    label: "Criar um roteiro pra gravar um vídeo",
    desc: "Ela escreve o que você vai falar — frase por frase",
    tool: "stories",
  },
];

const TRUST_COPIES = [
  "Pronto pra usar — só copia e aplica",
  "Gerado em segundos — sem esforço nenhum",
  "Funciona pra qualquer área, qualquer pessoa",
  "Isso pode te poupar horas de trabalho",
];

const SOCIAL_PROOF = [
  { emoji: "⭐", text: "Usei isso e já resolvi o que precisava hoje" },
  { emoji: "🙌", text: "Finalmente consigo escrever sem travar" },
  { emoji: "🔥", text: "Isso aqui facilita muito o meu dia a dia" },
];

export default function MotorIAPro() {
  const [selectedTool, setSelectedTool] = useState("bio");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [freeUses, setFreeUses] = useState(3);
  const [showModal, setShowModal] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dots, setDots] = useState("");
  const [trustIdx, setTrustIdx] = useState(0);
  const [showIntents, setShowIntents] = useState(true);
  const [selectedIntent, setSelectedIntent] = useState(null);
  const intervalRef = useRef(null);
  const cacheRef = useRef(new Map());
  const lastCallRef = useRef("");

  const currentTool = TOOLS.find((t) => t.id === selectedTool);
  const isTurbo = !currentTool?.free;
  const step = showOutput ? 3 : 2;

  useEffect(() => {
    if (loading) {
      intervalRef.current = setInterval(
        () => setDots((d) => (d.length >= 3 ? "" : d + ".")),
        380
      );
    } else {
      clearInterval(intervalRef.current);
      setDots("");
    }
    return () => clearInterval(intervalRef.current);
  }, [loading]);

  const handleGenerate = async () => {
    if (isTurbo || freeUses <= 0) { setShowModal(true); return; }
    if (!input.trim() || input.trim().length < 10) return;

    const cacheKey = `${selectedTool}::${input.trim()}`;
    if (cacheKey === lastCallRef.current) return;

    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setOutput(cached);
      setShowOutput(true);
      setTrustIdx(Math.floor(Math.random() * TRUST_COPIES.length));
      return;
    }

    lastCallRef.current = cacheKey;
    setLoading(true);
    setShowOutput(false);
    setOutput("");
    setTrustIdx(Math.floor(Math.random() * TRUST_COPIES.length));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: SYSTEM_PROMPTS[selectedTool],
          messages: [{ role: "user", content: input }],
        }),
      });
      const data = await res.json();
      const text =
        data.content?.find((c) => c.type === "text")?.text ||
        "Não consegui gerar. Tenta de novo.";
      setOutput(text);
      setShowOutput(true);
      setFreeUses((f) => f - 1);
      cacheRef.current.set(cacheKey, text);
    } catch {
      setOutput("Erro de conexão. Verifica sua internet e tenta de novo.");
      setShowOutput(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    lastCallRef.current = "";
    handleGenerate();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleIntent = (intent) => {
    setSelectedIntent(intent.id);
    setSelectedTool(intent.tool);
    setShowOutput(false);
    setInput("");
    setOutput("");
    setShowIntents(false);
  };

  const handleSelectTool = (id) => {
    setSelectedTool(id);
    setShowOutput(false);
    setInput("");
    setOutput("");
  };

  const getButtonLabel = () => {
    if (loading) return `Gerando${dots}`;
    if (isTurbo) return currentTool.buttonLabel;
    if (freeUses <= 0) return "🔒 Ver acesso completo";
    if (input.trim().length > 0 && input.trim().length < 10) return "Escreve mais um pouquinho...";
    return currentTool.buttonLabel;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #10101d;
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .m-root {
          background: #10101d;
          min-height: 100vh;
          color: #e8e6f4;
          padding: 24px 16px 96px;
        }
        .m-inner { max-width: 580px; margin: 0 auto; }

        /* ─── HEADER ─── */
        .m-header {
          display: flex; justify-content: space-between;
          align-items: flex-start; margin-bottom: 20px;
          gap: 12px; flex-wrap: wrap;
        }
        .m-logo {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 800;
          letter-spacing: -0.8px; color: #f4f2ff; line-height: 1.1;
        }
        .m-logo em { color: #f5b944; font-style: normal; }
        .m-logo-badge {
          display: inline-block; font-family: 'Inter', sans-serif;
          font-size: 10px; font-weight: 700;
          background: linear-gradient(135deg, #f5b944, #e09420);
          color: #0a0700; padding: 2px 8px; border-radius: 5px;
          letter-spacing: 0.5px; vertical-align: middle; margin-left: 6px;
        }
        .m-tagline {
          font-size: 14px; font-weight: 700;
          color: #f4f2ff; margin-top: 5px; line-height: 1.3;
        }
        .m-positioning {
          font-size: 12.5px; font-weight: 600;
          color: #f5c56b; margin-top: 2px;
        }
        .m-stats { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
        .m-stat {
          background: #18182e; border: 1px solid #2a2740;
          border-radius: 8px; padding: 7px 11px; text-align: center; min-width: 52px;
        }
        .m-stat-val { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800; color: #f5b944; line-height: 1.1; }
        .m-stat-key { font-size: 9px; font-weight: 600; color: #6b698a; letter-spacing: 0.8px; text-transform: uppercase; margin-top: 3px; }

        /* ─── STATUS BAR ─── */
        .m-status {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 14px; background: #14142a;
          border: 1px solid #2a2740; border-radius: 9px; margin-bottom: 12px;
        }
        .m-dot {
          width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
          background: #4ade80; box-shadow: 0 0 8px #4ade8066;
          animation: pulse 2s infinite;
        }
        .m-status-text { font-size: 12px; font-weight: 500; color: #b8b4d4; }
        .m-status-right { margin-left: auto; font-size: 10px; color: #45436a; font-family: 'DM Mono', monospace; }

        /* ─── PROMISE BAR ─── */
        .m-promise {
          font-size: 12.5px; font-weight: 500; color: #c8c4e4; text-align: center;
          padding: 10px 16px; margin-bottom: 20px;
          border: 1px solid #f5b94420; border-radius: 9px;
          background: linear-gradient(135deg, #f5b94408 0%, transparent 100%);
          line-height: 1.5;
        }

        /* ─── HERO ─── */
        .m-hero {
          text-align: center; padding: 28px 20px 22px;
          margin-bottom: 16px;
          background: linear-gradient(160deg, #16162c 0%, #10101d 100%);
          border: 1px solid #2a2740; border-radius: 16px;
          position: relative; overflow: hidden;
        }
        .m-hero::before {
          content: ''; position: absolute;
          top: 0; left: 50%; transform: translateX(-50%);
          width: 55%; height: 1px;
          background: linear-gradient(90deg, transparent, #f5b94455, transparent);
        }
        .m-hero-eyebrow {
          font-size: 11px; font-weight: 700; color: #f5b94499; letter-spacing: 1.5px;
          text-transform: uppercase; margin-bottom: 10px;
        }
        .m-hero-title {
          font-family: 'Syne', sans-serif;
          font-size: 26px; font-weight: 800; color: #f4f2ff;
          letter-spacing: -1px; line-height: 1.2; margin-bottom: 12px;
        }
        .m-hero-title em { color: #f5b944; font-style: normal; }
        .m-hero-sub {
          font-size: 15px; font-weight: 500; color: #c8c4e0;
          line-height: 1.65; margin-bottom: 8px;
        }
        .m-hero-extra {
          font-size: 13px; font-weight: 600; color: #e8e6f4;
          margin-bottom: 18px; line-height: 1.5;
        }
        .m-hero-bullets { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }
        .m-hero-bullet {
          font-size: 11px; font-weight: 700; color: #4ade80;
          background: #4ade8010; border: 1px solid #4ade8025;
          border-radius: 20px; padding: 4px 12px; letter-spacing: 0.2px;
        }

        /* ─── SOCIAL PROOF ─── */
        .m-social {
          margin-bottom: 20px;
          padding: 14px 16px;
          background: #14142a; border: 1px solid #2a2740; border-radius: 12px;
        }
        .m-social-count {
          font-size: 12px; font-weight: 700; color: #f5c56b;
          text-align: center; margin-bottom: 10px; letter-spacing: 0.2px;
        }
        .m-social-reviews { display: flex; flex-direction: column; gap: 6px; }
        .m-social-review {
          display: flex; align-items: center; gap: 9px;
          font-size: 12px; font-weight: 500; color: #b8b4d4;
          background: #1c1c34; border: 1px solid #2a2740;
          border-radius: 8px; padding: 8px 12px; line-height: 1.3;
        }
        .m-social-review span { font-size: 14px; flex-shrink: 0; }

        /* ─── PROGRESS STEPS ─── */
        .m-steps {
          display: flex; align-items: flex-start; margin-bottom: 20px;
        }
        .m-step {
          display: flex; flex-direction: column; align-items: center;
          gap: 5px; flex: 1; position: relative;
        }
        .m-step:not(:last-child)::after {
          content: ''; position: absolute;
          top: 11px; left: calc(50% + 14px);
          width: calc(100% - 28px); height: 1px;
          background: #2a2740; transition: background 0.3s;
        }
        .m-step.done:not(:last-child)::after { background: #f5b94433; }
        .m-step-dot {
          width: 22px; height: 22px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700;
          border: 1px solid #2a2740; color: #55537a; background: #18182e;
          transition: all 0.25s; position: relative; z-index: 1;
        }
        .m-step.active .m-step-dot {
          background: #f5b944; color: #0a0700; border-color: #f5b944;
          box-shadow: 0 0 16px #f5b94455;
        }
        .m-step.done .m-step-dot {
          background: #4ade8015; color: #4ade80; border-color: #4ade8033;
        }
        .m-step-lbl {
          font-size: 9px; color: #45436a; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.4px; text-align: center;
        }
        .m-step.active .m-step-lbl { color: #f5b944; }
        .m-step.done .m-step-lbl { color: #4ade8088; }

        /* ─── INTENT LAYER ─── */
        .m-intents-wrap { animation: fadeUp 0.3s ease; }
        .m-intents-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px; font-weight: 800; color: #f4f2ff;
          margin-bottom: 4px; letter-spacing: -0.3px;
        }
        .m-intents-sub { font-size: 13px; font-weight: 500; color: #c8c4e0; margin-bottom: 14px; }
        .m-intents-grid { display: flex; flex-direction: column; gap: 7px; margin-bottom: 14px; }

        .m-intent-btn {
          display: flex; align-items: center; gap: 13px;
          background: #14142a; border: 1px solid #2a2740;
          border-radius: 12px; padding: 14px 16px;
          cursor: pointer; text-align: left; width: 100%;
          transition: all 0.17s ease;
        }
        .m-intent-btn:hover {
          border-color: #f5b94466; background: #1c1000;
          transform: translateX(5px);
          box-shadow: -4px 0 0 #f5b944, 0 6px 24px #f5b9440d;
        }
        .m-intent-btn:active { transform: translateX(2px) scale(0.985); }
        .m-intent-emoji { font-size: 20px; flex-shrink: 0; width: 26px; text-align: center; }
        .m-intent-label {
          font-size: 14px; font-weight: 700; color: #f0eeff;
          margin-bottom: 2px; line-height: 1.2;
        }
        .m-intent-desc { font-size: 12px; font-weight: 500; color: #a1a1aa; line-height: 1.3; }

        .m-intent-skip {
          background: none; border: none; color: #45436a;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500;
          cursor: pointer; padding: 8px 0; transition: color 0.2s;
        }
        .m-intent-skip:hover { color: #9896b8; }

        /* ─── TOOL GRID ─── */
        .m-tools {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 7px; margin-bottom: 8px;
        }
        @media (max-width: 420px) { .m-tools { grid-template-columns: 1fr; } }

        .m-tool {
          background: #14142a; border: 1px solid #2a2740;
          border-radius: 11px; padding: 13px; cursor: pointer;
          text-align: left; transition: all 0.17s ease;
          position: relative; overflow: hidden;
        }
        .m-tool::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, #f5b94408, transparent);
          opacity: 0; transition: opacity 0.2s;
        }
        .m-tool:hover { border-color: #f5b94466; transform: translateY(-3px); box-shadow: 0 8px 24px #f5b9440f; }
        .m-tool:hover::before { opacity: 1; }
        .m-tool:active { transform: translateY(0) scale(0.975); transition: transform 0.1s; }
        .m-tool.active { border-color: #f5b94488; background: #18100a; }
        .m-tool.active::before { opacity: 1; }

        .m-tool-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
        .m-tool-icon { font-size: 13px; color: #3a3860; transition: color 0.2s; }
        .m-tool.active .m-tool-icon { color: #f5b944; }
        .m-tool:hover .m-tool-icon { color: #f5b94488; }

        .badge { font-size: 9px; font-weight: 700; letter-spacing: 0.5px; padding: 2px 7px; border-radius: 4px; }
        .badge-free { background: #f5b94418; color: #f5b944; border: 1px solid #f5b94433; }
        .badge-lock { background: #1e1c38; color: #55537a; border: 1px solid #2a2740; }

        .m-tool-label { font-size: 11px; font-weight: 600; color: #c8c4e0; line-height: 1.35; margin-bottom: 3px; transition: color 0.2s; }
        .m-tool.active .m-tool-label { color: #f4f2ff; }
        .m-tool:hover .m-tool-label { color: #f0eeff; }
        .m-tool-sub { font-size: 10px; font-weight: 500; color: #6b698a; line-height: 1.3; }

        .m-back-btn {
          background: none; border: none; color: #45436a;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500;
          cursor: pointer; padding: 10px 0; margin-bottom: 4px;
          display: block; transition: color 0.2s;
        }
        .m-back-btn:hover { color: #f5b944; }

        /* ─── INPUT AREA ─── */
        .m-input-label { font-size: 13px; font-weight: 700; color: #e8e6f4; margin-bottom: 4px; }
        .m-input-label span { color: #c8c4e0; font-weight: 500; }
        .m-input-hint { font-size: 12px; font-weight: 500; color: #a1a1aa; margin-bottom: 8px; }

        .m-textarea {
          width: 100%; background: #14142a;
          border: 1px solid #2a2740; border-radius: 11px;
          padding: 13px 15px; color: #e8e6f4;
          font-family: 'Inter', sans-serif; font-size: 14px;
          line-height: 1.6; resize: vertical; min-height: 88px;
          outline: none; transition: border-color 0.22s, box-shadow 0.22s;
          margin-bottom: 8px;
        }
        .m-textarea:focus { border-color: #f5b94455; box-shadow: 0 0 0 3px #f5b9440a; }
        .m-textarea::placeholder { color: #2e2c50; }

        .m-example-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
        .m-example-lbl { font-size: 10px; font-weight: 700; color: #45436a; text-transform: uppercase; letter-spacing: 0.4px; flex-shrink: 0; }
        .m-example-chip {
          font-size: 11px; font-weight: 500; color: #9896b8; background: #18182e;
          border: 1px solid #2a2740; border-radius: 20px;
          padding: 5px 13px; cursor: pointer; transition: all 0.17s;
          font-family: 'Inter', sans-serif;
          max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .m-example-chip:hover { border-color: #f5b94455; color: #f5b944; background: #18100a; }
        .m-example-chip:active { transform: scale(0.97); }

        /* ─── PRESSURE BANNERS ─── */
        .m-pressure {
          font-size: 12.5px; font-weight: 700; text-align: center;
          padding: 10px 16px; margin-bottom: 10px; border-radius: 9px;
          animation: fadeUp 0.3s ease;
          background: #1c1408; border: 1px solid #f5b94430; color: #f5b944cc;
        }
        .m-pressure-urgent { background: #1c0808; border-color: #ef444430; color: #ef4444cc; }
        .m-pressure-locked {
          background: #18182e; border-color: #2a2740; color: #a8a6cc;
          cursor: pointer; transition: border-color 0.2s;
        }
        .m-pressure-locked:hover { border-color: #f5b94444; }

        /* ─── BUTTONS ─── */
        .m-btn {
          width: 100%; border: none; border-radius: 11px;
          padding: 15px 20px; font-family: 'Inter', sans-serif;
          font-weight: 800; font-size: 15px; cursor: pointer;
          letter-spacing: -0.2px; transition: all 0.2s ease;
        }
        .m-btn-active {
          background: linear-gradient(135deg, #f5b944 0%, #e09420 100%);
          color: #0a0700; box-shadow: 0 4px 20px #f5b94420;
        }
        .m-btn-active:hover:not(:disabled) {
          background: linear-gradient(135deg, #fcd34d 0%, #f5b944 100%);
          transform: translateY(-3px); box-shadow: 0 12px 36px #f5b94435;
        }
        .m-btn-active:active:not(:disabled) { transform: translateY(0) scale(0.975); box-shadow: none; transition: transform 0.1s; }
        .m-btn-active:disabled { opacity: 0.36; cursor: default; box-shadow: none; }

        .m-btn-lock { background: #18182e; color: #9896b8; border: 1px solid #2a2740; }
        .m-btn-lock:hover { border-color: #f5b94444; color: #f5b944; background: #18100a; }

        .m-btn-secondary {
          width: 100%; border: 1px solid #2a2740; border-radius: 11px;
          padding: 12px 20px; font-family: 'Inter', sans-serif;
          font-weight: 600; font-size: 13px; cursor: pointer;
          color: #a8a6cc; background: #14142a; margin-top: 10px;
          transition: all 0.18s;
        }
        .m-btn-secondary:hover { border-color: #f5b94444; color: #f5b944; background: #18100a; }

        /* ─── LOADING STATE ─── */
        .m-loading-msg {
          display: flex; align-items: center; gap: 12px;
          font-size: 13px; font-weight: 600;
          color: #c8c4e0; margin-bottom: 12px; padding: 14px 16px;
          background: #14142a; border: 1px solid #f5b94422; border-radius: 10px;
          animation: fadeUp 0.3s ease;
        }
        .m-loading-spinner { font-size: 20px; flex-shrink: 0; color: #f5b944; }
        .m-loading-main { font-size: 13px; font-weight: 600; color: #c8c4e0; }
        .m-loading-sub { font-size: 11px; font-weight: 500; color: #6b698a; margin-top: 2px; }

        /* ─── OUTPUT ─── */
        .m-output-wrap { margin-top: 20px; animation: fadeUp 0.4s ease; }
        .m-output {
          background: #0e0e1c; border: 1px solid #f5b9441c;
          border-radius: 12px; padding: 18px 18px 16px;
          font-family: 'DM Mono', 'Courier New', monospace;
          font-size: 13px; line-height: 1.9; color: #d8d4f4;
          white-space: pre-wrap; word-break: break-word;
        }

        .m-dop0 { margin-top: 10px; font-size: 13px; font-weight: 700; color: #4ade80; animation: fadeUp 0.5s ease 0.05s both; }
        .m-dop1 { margin-top: 4px; font-size: 13px; font-weight: 600; color: #f5b944; animation: fadeUp 0.5s ease 0.12s both; }
        .m-dop2 { margin-top: 4px; font-size: 12px; font-weight: 600; color: #c8c4e0; animation: fadeUp 0.5s ease 0.2s both; }
        .m-dop3 { margin-top: 4px; font-size: 12px; font-weight: 600; color: #7dd3fc; animation: fadeUp 0.5s ease 0.28s both; }

        .m-copy-main {
          padding: 11px 24px; font-size: 14px; font-weight: 800;
          background: linear-gradient(135deg, #f5b944 0%, #e09420 100%);
          color: #0a0700; border: none; border-radius: 9px;
          cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 16px #f5b94422;
        }
        .m-copy-main:hover { transform: scale(1.04); box-shadow: 0 8px 24px #f5b94433; }
        .m-copy-main:active { transform: scale(0.98); box-shadow: none; }
        .m-copy-main.ok {
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
          color: #0a1a0a; box-shadow: 0 4px 16px #4ade8022;
          animation: copyPop 0.35s ease;
        }

        .m-use-real {
          font-size: 13px; font-weight: 500; color: #b8b4d4; text-align: center;
          padding: 10px 16px; margin-bottom: 18px;
          border: 1px solid #2a2740; border-radius: 9px; background: #14142a;
          line-height: 1.5;
        }

        .m-regen-hint {
          font-size: 12px; font-weight: 500; color: #a1a1aa;
          text-align: center; margin-top: 14px; margin-bottom: 6px;
          font-style: italic;
        }

        .m-next-step {
          margin-top: 14px; padding: 13px 15px;
          background: #14142a; border: 1px solid #2a2740; border-radius: 10px;
          animation: fadeUp 0.5s ease 0.3s both;
        }
        .m-next-step-lbl { font-size: 9px; font-weight: 700; color: #6b698a; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 5px; }
        .m-next-step-text { font-size: 13px; font-weight: 600; color: #c8c4e0; line-height: 1.4; }

        .m-output-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 13px; flex-wrap: wrap; gap: 8px; }
        .m-trust {
          display: flex; align-items: center; gap: 6px;
          background: #0a1408; border: 1px solid #1a3d1a22;
          border-radius: 20px; padding: 5px 13px;
          font-size: 11px; font-weight: 500; color: #4ade8088;
        }
        .m-trust-dot { width: 5px; height: 5px; border-radius: 50%; background: #4ade80; flex-shrink: 0; }

        .m-copy {
          background: #f5b94418; border: 1px solid #f5b94444;
          color: #f5b944; border-radius: 9px; padding: 9px 20px;
          font-family: 'Inter', sans-serif; font-size: 13px;
          font-weight: 700; cursor: pointer; transition: all 0.18s;
          white-space: nowrap;
        }
        .m-copy:hover { background: #f5b944; color: #0a0700; transform: scale(1.03); }
        .m-copy.ok {
          background: #4ade8020; border-color: #4ade8044; color: #4ade80;
          animation: copyPop 0.35s ease;
        }

        /* ─── MODAL ─── */
        .m-modal-bg {
          min-height: 100vh; background: rgba(5,5,15,0.92);
          display: flex; align-items: center; justify-content: center;
          position: fixed; inset: 0; z-index: 50;
          animation: fadeIn 0.2s ease; backdrop-filter: blur(12px);
          padding: 16px;
        }
        .m-modal {
          background: #14142a; border: 1px solid #f5b94444;
          border-radius: 20px; padding: 28px 22px;
          max-width: 360px; width: 100%; animation: slideUp 0.3s ease;
          max-height: 92vh; overflow-y: auto;
        }
        .m-modal-icon { text-align: center; font-size: 30px; margin-bottom: 10px; }
        .m-modal-title {
          font-family: 'Syne', sans-serif;
          text-align: center; font-size: 19px; font-weight: 800;
          color: #f4f2ff; margin-bottom: 10px; letter-spacing: -0.4px;
        }
        .m-modal-narrative {
          text-align: center; font-size: 14px; font-weight: 500;
          color: #c8c4e8; line-height: 1.7; margin-bottom: 18px;
        }

        .m-modal-tiers { display: flex; flex-direction: column; gap: 7px; margin-bottom: 16px; }
        .m-modal-tier {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 13px; border-radius: 10px;
          border: 1px solid #2a2740; background: #1c1c38;
        }
        .m-modal-tier-icon { font-size: 16px; flex-shrink: 0; }
        .m-modal-tier-title { font-size: 12px; font-weight: 700; color: #c8c4e8; }
        .m-modal-tier-sub { font-size: 10px; font-weight: 500; color: #55537a; margin-top: 1px; }
        .m-modal-tier.hl { border-color: #f5b94444; background: #1a1000; }
        .m-modal-tier.hl .m-modal-tier-title { color: #f5b944; }

        .m-modal-vps {
          display: flex; flex-direction: column; gap: 6px;
          margin-bottom: 16px; padding: 12px 14px;
          background: #f5b94408; border: 1px solid #f5b94418; border-radius: 10px;
        }
        .m-vp { font-size: 13px; font-weight: 600; color: #d8d4f4; display: flex; align-items: center; gap: 8px; }

        .m-price-box {
          background: #0e0e1c; border: 1px solid #f5b9442a;
          border-radius: 10px; padding: 14px; text-align: center; margin-bottom: 14px;
        }
        .m-price-tag { font-size: 9px; font-weight: 700; color: #9896b8; letter-spacing: 1.5px; margin-bottom: 4px; text-transform: uppercase; }
        .m-price-val { font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800; color: #f5b944; line-height: 1; }
        .m-price-note { font-size: 11px; font-weight: 500; color: #9896b8; margin-top: 5px; }

        .m-features { display: flex; flex-direction: column; gap: 7px; margin-bottom: 14px; }
        .m-feat { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; font-weight: 500; color: #c8c4e8; line-height: 1.4; }
        .m-feat-check { color: #4ade80; font-size: 12px; flex-shrink: 0; margin-top: 1px; }

        .m-urgency { text-align: center; font-size: 10px; font-weight: 600; color: #f5b94477; margin-bottom: 12px; letter-spacing: 0.3px; }
        .m-modal-guarantee { text-align: center; font-size: 11px; font-weight: 500; color: #9896b8; margin-top: 8px; }
        .m-modal-close {
          background: none; border: none; color: #3d3b60;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500;
          cursor: pointer; width: 100%; padding: 10px; text-align: center; transition: color 0.2s;
        }
        .m-modal-close:hover { color: #9896b8; }

        /* ─── FOOTER ─── */
        .m-footer {
          margin-top: 44px; text-align: center;
          font-size: 11px; font-weight: 500; color: #2a2848;
          letter-spacing: 0.3px; line-height: 1.6;
        }
        .m-footer-tagline { color: #45436a; margin-top: 3px; font-size: 10px; }

        /* ─── ANIMATIONS ─── */
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px #4ade8066; }
          50% { opacity: 0.5; box-shadow: none; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes copyPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        .spin { display: inline-block; animation: spin 1s linear infinite; }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 480px) {
          .m-root { padding: 18px 14px 80px; }
          .m-header { flex-direction: column; gap: 10px; }
          .m-stats { flex-direction: row; }
          .m-hero-title { font-size: 19px; }
          .m-hero-sub { font-size: 13px; }
          .m-modal { padding: 22px 16px; border-radius: 16px; }
          .m-btn { font-size: 14px; padding: 14px 16px; }
          .m-intents-title { font-size: 16px; }
        }
      `}</style>

      <div className="m-root">
        <div className="m-inner">

          {/* ── HEADER ── */}
          <div className="m-header">
            <div>
              <div className="m-logo">
                Motor<em>IA</em>
                <span className="m-logo-badge">PRO</span>
              </div>
              <div className="m-tagline">Pare de travar. A IA resolve por você em segundos.</div>
              <div className="m-positioning">Sem saber nada. Sem esforço. Sem perder tempo.</div>
            </div>
            <div className="m-stats">
              <div className="m-stat">
                <div className="m-stat-val">+6</div>
                <div className="m-stat-key">ferramentas</div>
              </div>
              <div className="m-stat">
                <div className="m-stat-val" style={{ color: freeUses > 0 ? "#4ade80" : "#ef4444" }}>{freeUses}</div>
                <div className="m-stat-key">grátis</div>
              </div>
            </div>
          </div>

          {/* ── STATUS ── */}
          <div className="m-status">
            <div className="m-dot" />
            <span className="m-status-text">Sua IA está pronta para trabalhar</span>
            <span className="m-status-right">resposta em segundos</span>
          </div>

          {/* ── PROMISE ── */}
          <div className="m-promise">
            Trava pra escrever, responder ou criar? Aqui você descreve o que quer — e sai pronto.
          </div>

          {/* ── PROGRESS STEPS (fora dos intents) ── */}
          {!showIntents && (
            <div className="m-steps">
              {[{ n: 1, lbl: "Escolha" }, { n: 2, lbl: "Descreva" }, { n: 3, lbl: "Copie e use" }].map(({ n, lbl }) => (
                <div key={n} className={`m-step ${step === n ? "active" : step > n ? "done" : ""}`}>
                  <div className="m-step-dot">{step > n ? "✓" : n}</div>
                  <div className="m-step-lbl">{lbl}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── INTENT LAYER ── */}
          {showIntents ? (
            <div className="m-intents-wrap">

              {/* Hero */}
              <div className="m-hero">
                <div className="m-hero-eyebrow">Seu assistente pessoal com IA</div>
                <div className="m-hero-title">
                  Travou? Não sabe<br />
                  <em>o que escrever?</em>
                </div>
                <div className="m-hero-sub">
                  A IA faz por você em segundos — sem esforço, sem conhecimento, sem complicação.
                </div>
                <div className="m-hero-extra">
                  Escreve, responde, cria e resolve qualquer coisa. Só descreve o que quer.
                </div>
                <div className="m-hero-bullets">
                  <span className="m-hero-bullet">Sem saber nada</span>
                  <span className="m-hero-bullet">Sem complicação</span>
                  <span className="m-hero-bullet">Sem perder tempo</span>
                </div>
              </div>

              {/* Social proof */}
              <div className="m-social">
                <div className="m-social-count">🚀 Pessoas já estão usando isso todos os dias</div>
                <div className="m-social-reviews">
                  {SOCIAL_PROOF.map((r, i) => (
                    <div key={i} className="m-social-review">
                      <span>{r.emoji}</span>
                      {r.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* B4 — reforço de uso real */}
              <div className="m-use-real">
                Você pode usar isso pra escrever, responder, criar ideias ou organizar qualquer coisa.
              </div>

              <div className="m-intents-title">Com o que posso te ajudar agora?</div>
              <div className="m-intents-sub">Você pensa. Eu faço. Escolhe uma opção abaixo.</div>

              <div className="m-intents-grid">
                {INTENTS.map((intent) => (
                  <button key={intent.id} className="m-intent-btn" onClick={() => handleIntent(intent)}>
                    <span className="m-intent-emoji">{intent.emoji}</span>
                    <div>
                      <div className="m-intent-label">{intent.label}</div>
                      <div className="m-intent-desc">{intent.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <button className="m-intent-skip" onClick={() => setShowIntents(false)}>
                Ver todas as ferramentas disponíveis →
              </button>
            </div>

          ) : (
            <>
              {/* Tool grid */}
              <div className="m-tools">
                {TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    className={`m-tool${selectedTool === tool.id ? " active" : ""}`}
                    onClick={() => handleSelectTool(tool.id)}
                  >
                    <div className="m-tool-top">
                      <span className="m-tool-icon">{tool.icon}</span>
                      {tool.free
                        ? <span className="badge badge-free">GRÁTIS</span>
                        : <span className="badge badge-lock">🔒 TURBO</span>}
                    </div>
                    <div className="m-tool-label">{tool.label}</div>
                    <div className="m-tool-sub">{tool.sub}</div>
                  </button>
                ))}
              </div>
              <button className="m-back-btn" onClick={() => { setShowIntents(true); setShowOutput(false); }}>
                ← Voltar para o início
              </button>
            </>
          )}

          {/* ── INPUT + OUTPUT ── */}
          {!showIntents && (
            <>
              <div className="m-input-label">
                Escreve do seu jeito — <span>não precisa saber nada</span>
              </div>
              <div className="m-input-hint">É só descrever o que você quer. Relaxa, eu faço o resto.</div>

              <textarea
                className="m-textarea"
                rows={4}
                placeholder={PLACEHOLDERS[selectedTool]}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />

              {/* Clickable example */}
              <div className="m-example-row">
                <span className="m-example-lbl">Exemplo</span>
                <button
                  className="m-example-chip"
                  onClick={() => setInput(EXAMPLES[selectedTool])}
                  title={EXAMPLES[selectedTool]}
                >
                  {EXAMPLES[selectedTool].length > 50
                    ? EXAMPLES[selectedTool].slice(0, 50) + "…"
                    : EXAMPLES[selectedTool]}
                </button>
              </div>

              {/* Pressure banners */}
              {!isTurbo && freeUses > 0 && freeUses <= 2 && (
                <div className={`m-pressure${freeUses === 1 ? " m-pressure-urgent" : ""}`}>
                  {freeUses === 2
                    ? "⚠️ Você ainda tem 2 usos grátis"
                    : "🚨 Último uso gratuito disponível"}
                </div>
              )}
              {!isTurbo && freeUses === 0 && (
                <div className="m-pressure m-pressure-locked" onClick={() => setShowModal(true)}>
                  🔒 Desbloqueie o modo completo para continuar
                </div>
              )}

              {/* B4 — Loading inteligente */}
              {loading && (
                <div className="m-loading-msg">
                  <div className="m-loading-spinner">
                    <span className="spin">⟳</span>
                  </div>
                  <div>
                    <div className="m-loading-main">A IA está organizando isso pra você{dots}</div>
                    <div className="m-loading-sub">Só um segundo — vai sair pronto</div>
                  </div>
                </div>
              )}

              {/* CTA button */}
              <button
                className={`m-btn ${isTurbo || freeUses <= 0 ? "m-btn-lock" : "m-btn-active"}`}
                onClick={handleGenerate}
                disabled={loading || (!isTurbo && freeUses > 0 && input.trim().length < 10)}
              >
                {loading
                  ? <><span className="spin">⟳</span>&nbsp; Gerando{dots}</>
                  : getButtonLabel()}
              </button>

              {/* Output */}
              {showOutput && output && (
                <div className="m-output-wrap">
                  <div className="m-output">{output}</div>

                  <div className="m-dop0">✅ Você já pode usar isso agora</div>
                  <div className="m-dop1">💸 Isso pode te poupar horas hoje</div>
                  <div className="m-dop2">⚡ Isso aqui substitui o que você faria sozinho por horas</div>
                  <div className="m-dop3">👆 Copia e usa — já está pronto</div>

                  <div className="m-next-step">
                    <div className="m-next-step-lbl">Próximo passo recomendado</div>
                    <div className="m-next-step-text">👉 {NEXT_STEPS[selectedTool]}</div>
                  </div>

                  <div className="m-output-footer">
                    <div className="m-trust">
                      <div className="m-trust-dot" />
                      {TRUST_COPIES[trustIdx]}
                    </div>
                    <button className={`m-copy m-copy-main${copied ? " ok" : ""}`} onClick={handleCopy}>
                      {copied ? "✔ Copiado — usa agora!" : "📋 Copiar tudo"}
                    </button>
                  </div>

                  {/* Loop de vício */}
                  <div className="m-regen-hint">A primeira versão já funciona… mas dá pra melhorar ainda mais</div>
                  <button className="m-btn-secondary" onClick={handleRegenerate}>
                    🔄 Gerar outra versão
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── FOOTER ── */}
          <div className="m-footer">
            MOTOR IA PRO · JEAN LUCCA · RENDA COM IA
            <div className="m-footer-tagline">Criado pra quem quer resultado rápido usando IA</div>
          </div>

        </div>
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div className="m-modal-bg" onClick={() => setShowModal(false)}>
          <div className="m-modal" onClick={(e) => e.stopPropagation()}>
            <div className="m-modal-icon">⚡</div>
            <div className="m-modal-title">Acesso Completo — R$27</div>
            <div className="m-modal-narrative">
              Agora imagina não travar nunca mais<br />
              pra escrever, responder ou criar qualquer coisa.<br /><br />
              <span style={{ color: "#d8d4f4" }}>Você resolve em segundos.<br />Sem esforço. Sem pensar muito.</span><br /><br />
              <strong style={{ color: "#f5b944", fontSize: 15 }}>R$27 uma vez.</strong><br />
              <span style={{ color: "#6b698a", fontSize: 13 }}>Ou continuar perdendo tempo todo dia.</span>
            </div>

            <div className="m-modal-tiers">
              <div className="m-modal-tier">
                <span className="m-modal-tier-icon">🎁</span>
                <div>
                  <div className="m-modal-tier-title">Teste grátis</div>
                  <div className="m-modal-tier-sub">3 usos pra experimentar</div>
                </div>
              </div>
              <div className="m-modal-tier hl">
                <span className="m-modal-tier-icon">⚡</span>
                <div>
                  <div className="m-modal-tier-title">Turbo — R$27 vitalício</div>
                  <div className="m-modal-tier-sub">6 ferramentas · uso ilimitado · pra sempre</div>
                </div>
              </div>
            </div>

            <div className="m-modal-vps">
              <div className="m-vp">💸 1 venda já paga o acesso completo</div>
              <div className="m-vp">🔁 Uso ilimitado pra sempre</div>
            </div>

            <div className="m-price-box">
              <div className="m-price-tag">Oferta de validação</div>
              <div className="m-price-val">R$ 27</div>
              <div className="m-price-note">acesso vitalício · sem mensalidade · sem renovação</div>
            </div>

            <div className="m-features">
              {[
                "6 ferramentas de IA desbloqueadas",
                "Escreve, resolve e cria qualquer coisa",
                "Roteiro de vídeo pronto pra gravar hoje",
                "Sequência de mensagens pronta pra usar",
                "Gera quantas vezes quiser — sem limite",
              ].map((feat) => (
                <div key={feat} className="m-feat">
                  <span className="m-feat-check">✓</span>{feat}
                </div>
              ))}
            </div>

            <div className="m-urgency">⏱ Preço de lançamento por tempo limitado</div>

            <button
              className="m-btn m-btn-active"
              style={{ marginBottom: 8 }}
              onClick={() => {
                setShowModal(false);
                window.open("https://seulink.com/checkout", "_blank");
              }}
            >
              Quero desbloquear por R$27 agora →
            </button>

            <div className="m-modal-guarantee">Sem mensalidade. Pagou uma vez, usa sempre.</div>

            <button className="m-modal-close" onClick={() => setShowModal(false)}>
              Continuar com versão gratuita
            </button>
          </div>
        </div>
      )}
    </>
  );
}
