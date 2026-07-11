# 01 — Marca e posicionamento

**Última atualização:** 2026-07-11
**Responsável:** Time de marca LoudFit
**Status:** Consolidado (com pontos históricos a validar)

---

## Resumo

Este documento consolida a identidade da marca LoudFit: histórico, propósito, posicionamento, tom de voz, mensagens principais, diretrizes de comunicação e vocabulário. É a referência obrigatória para qualquer redação de site, campanha, atendimento, artes de Instagram, script de recepção e comunicação institucional.

Fontes usadas nesta consolidação:

- `docs/PRD_LOUDFIT.md`
- `VISUAL_DIRECTION.md`
- `AUDIT.md`
- `CHANGELOG.md`
- Cópias existentes nas páginas `/`, `/sobre`, `/franquias`, `/unidades/[slug]`, `/modalidades`
- Instruções comerciais compartilhadas pelo time (energia, atitude, comunidade, resultado).

---

## Histórico da marca

A LoudFit nasceu para transformar a experiência de treino em **rede de academias com estrutura completa, aulas coletivas inclusas e presença de bairro**. As primeiras unidades operam em pontos onde funcionavam lojas **Pano Bianco**. Isso gera um passivo específico no Google Business Profile (ver `07-google-business-profile.md`): há risco de perfis antigos ainda estarem no nome do negócio anterior, o que precisa ser saneado unidade a unidade.

Data exata de fundação, histórico dos fundadores e milestones oficiais: `PENDENTE DE CONFIRMAÇÃO` com o time comercial.

A página `/sobre` já usa a estrutura "Nossa história / Identidade / Missão / Visão / Valores / Pessoas", com placeholders para fundadores. A seção de pessoas está preparada para receber fotos oficiais quando disponíveis (`src/app/sobre/page.tsx`, bloco "Quem constrói a Loud Fit").

---

## Propósito

Transformar academias em centros de **energia, atitude e resultados reais**.

Não é sobre vender musculação. É sobre entregar uma experiência de treino completa (musculação + aulas coletivas + estrutura + reconhecimento facial + comunidade) por um valor acessível, com matrícula online simples.

---

## Posicionamento

A LoudFit se posiciona como:

- **Academia moderna**, não uma landing genérica.
- **Rede fitness em expansão** com operação real (não uma marca de fachada).
- **Acessível, mas profissional** — não é academia low-cost sem estrutura, não é clube premium caro.
- **Forte em aulas coletivas** inclusas no plano.
- **Fácil de contratar online** via checkout EVO.
- **De bairro, com estrutura completa** — próxima do aluno.
- **Marca com energia, movimento e presença real.**

A LoudFit **não** deve parecer:

- Galpão ou loja de material de construção.
- Landing genérica gerada por IA.
- Site dark conceitual.
- Template sem personalidade.
- Página institucional fria.

Referências de acabamento (usadas apenas para lógica comercial e ritmo visual, **nunca** copiadas em texto, cor ou imagem):

- **Smart Fit** — clareza comercial, cards de planos, funil curto.
- **SkyFit** — energia fitness, visual mais vivo, sensação de academia real.
- **Bluefit** — a unidade como decisão principal e site de rede.

---

## Significado do nome

A palavra "LOUD" tem quatro pilares associados na página `/sobre`:

| Letra | Palavra | Sentido |
| ----- | ------- | ------- |
| L | Liberdade | Treine do seu jeito. Evolua no seu ritmo. |
| O | Ousadia | Desafiar limites faz parte da nossa cultura. |
| U | União | Uma comunidade que cresce junto. |
| D | Determinação | A constância é o caminho para os resultados. |

Fonte: `src/app/sobre/page.tsx`.

Complementarmente, "LoudFit" representa uma marca que fala alto sobre: **disciplina, movimento, constância, evolução, experiência, comunidade e resultado**.

---

## Missão e visão

- **Missão (site):** "Transformar vidas por meio da atividade física, oferecendo uma experiência completa, acolhedora e motivadora para todos que escolhem fazer parte da Loud Fit."
- **Visão (site):** "Ser referência nacional em academias, unindo estrutura, atendimento, tecnologia e uma comunidade forte, tornando a Loud Fit uma das maiores redes fitness do Brasil."

Fonte: `src/app/sobre/page.tsx`.

---

## Valores

Conforme `src/app/sobre/page.tsx`:

- Disciplina
- Respeito
- Evolução
- Compromisso
- Energia
- Resultado

---

## Diferenciais comerciais

A LoudFit vende uma experiência completa. Os diferenciais são:

1. **Primeira mensalidade por R$ 9,90** no Power Anual Recorrente.
2. **Aulas coletivas inclusas** em todos os planos.
3. **Acesso livre às unidades LoudFit** para alunos matriculados.
4. **Convidados: até 5 acessos.**
5. **Aula experimental grátis** para musculação, cardio e coletivas.
6. **Reconhecimento facial** para entrada nas unidades.
7. **Matrícula online via checkout EVO.**
8. **Rede em expansão** com unidades de bairro.

Ordem de destaque comercial:

1. R$ 9,90 (chama atenção).
2. Aulas coletivas inclusas (justifica valor).
3. Acesso às unidades.
4. Convidados até 5 acessos.
5. Aula experimental grátis.
6. Reconhecimento facial.
7. Checkout online.

Regras imutáveis:

- **R$ 9,90 aparece apenas no Power Anual Recorrente.**
- Não usar "sem fidelidade".
- Na Home, **não expor preço específico da Ipiranga**; usar "Depois, mensalidade conforme a unidade escolhida."
- Não inventar aulas, duração, regras de convidados ou condições novas.

Fonte: `docs/PRD_LOUDFIT.md` (seções 6–14) e `src/lib/plans.ts`.

---

## Tom de voz

- **Simples**, direto, energético, comercial, acessível.
- Frases curtas.
- Benefício claro.
- CTA direto.
- Linguagem de academia real.
- Valor percebido.

Evitar:

- Texto institucional genérico.
- Frases longas.
- Excesso de adjetivos.
- Promessa exagerada.
- Linguagem muito técnica.
- Textos com cara de IA.
- Copy fria demais.
- Excesso de UPPERCASE (uso restrito a labels, badges e nav — não em títulos automáticos).
- Excesso de bullets.

---

## Mensagens principais

Blocos de copy oficiais confirmados no repositório:

- **Tagline principal:** "O melhor ainda está por vir." (usada em Hero e Footer).
- **H1 da Home:** "O melhor ainda está por vir." (`src/components/sections/Hero.tsx`).
- **OG title (Home):** "Loud Fit | Academia com musculação e aulas inclusas".
- **OG description (Home):** "Escolha sua unidade, veja os planos e faça sua matrícula online. Musculação e aulas coletivas em um só plano."
- **Selo da Home:** "1ª mensalidade R$9,90 · Power Anual Recorrente*".
- **CTA principal:** "Encontrar minha unidade".
- **CTA secundário:** "Ver planos".
- **Mensagem-chave de aulas coletivas:** "Na Loud Fit, aulas coletivas já estão incluídas no plano." (equivalentes: "Musculação + aulas coletivas no mesmo plano." | "Do Muay Thai ao Pilates: já está incluso no plano.")
- **Mensagem de convidados:** "Convide até 5 vezes." | "Benefício de convidados: até 5 acessos." | "Leve convidados em até 5 acessos." Evitar "levar 5 amigos ou um só 5x".
- **Mensagem de experimentação:** "Aula experimental grátis." | "Experimente antes de começar." | "Teste musculação, cardio ou aulas coletivas."
- **Página de matrícula:** "Primeira mensalidade por R$9,90. No Power Anual Recorrente." (`src/app/unidades/[slug]/page.tsx`).

---

## Diretrizes de nomenclatura

- Em copy visível preferir **"Loud Fit" separado**.
- **Não alterar** nomes técnicos, variáveis, slugs, arquivos ou metadata técnica que usem "LoudFit" (mantido junto para consistência interna).
- **Nome oficial no GBP:** `LoudFit [Nome da Unidade]` (ex.: `LoudFit Carrefour Valinhos`).
- Logo oficial: `loudfit-logo-official-lockup-yellow.png` (nunca substituir por texto).
- Símbolo oficial: `loudfit-logo-official-symbol-yellow.png`.

Fonte: `docs/PRD_LOUDFIT.md` (seção 15), `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`.

---

## Termos que devem ser usados

- Musculação e aulas coletivas em um só plano.
- Estrutura completa.
- Acesso livre às unidades.
- Convidados até 5 acessos.
- Aula experimental grátis.
- Reconhecimento facial.
- Checkout online / matrícula online.
- Rede em expansão.
- O melhor ainda está por vir.

## Termos que não devem ser usados

- "Sem fidelidade".
- "LoudFit LoudFit" (dobra proibida).
- Frases internas antigas como "Venda online via EVO será conectada" ou "Matrícula online em breve via página de vendas EVO".
- "A rede que treina alto" como tagline principal.
- Promessas de "maior rede" ou "número de alunos" sem base real.
- Depoimentos, avaliações e números inventados.

Fonte: `docs/PRD_LOUDFIT.md` (seção 14), `AUDIT.md`, memória do projeto.

---

## Diretrizes visuais (resumo estratégico)

O detalhamento visual está em `VISUAL_DIRECTION.md`, `AUDIT.md` e `CHANGELOG.md`. Aqui ficam somente as decisões estratégicas de marca:

- **Amarelo LoudFit `#FFE500` (`--lf-volt`) como cor de ação** e assinatura de identidade.
- **Preto `#080808` (`--lf-black`) como base**, mas **evitar site inteiramente escuro** — alternar com fundos claros/off-white nas seções comerciais (planos, unidades) para respiro.
- **Diagonal 3px amarela** como marca de identidade (rodapé do hero, corner marks).
- **Big Shoulders (display)** e **Inter (body)** como tipografia (`src/app/layout.tsx`).
- **Cards premium** com hierarquia clara, radius elegante, sombra leve.
- Fotos com **energia real de treino** (não academia vazia).
- Nada de glassmorphism genérico, gradientes roxo/azul, emojis em headlines ou visual industrial.

---

## Diretrizes de campanha

- Toda campanha comercial deve conversar com pelo menos um diferencial oficial da marca (R$ 9,90, aulas coletivas inclusas, acesso livre, convidados até 5, experimental grátis, reconhecimento facial, matrícula online).
- Toda campanha deve indicar claramente a unidade escolhida antes de mostrar preço.
- Toda campanha deve ter um destino técnico (landing, WhatsApp, checkout) claro e rastreável.
- A **campanha Day Use** deve ser unificada para toda a rede (ver `06-campanha-day-use.md`).

---

## Próximas ações

- Confirmar data de fundação, origem do nome e biografia oficial dos fundadores.
- Definir imagens oficiais para a seção "Pessoas" da página `/sobre`.
- Formalizar um guia de estilo curto (1 página) para tráfego pago e artes de Instagram, alinhado a este documento.
- Validar termos comerciais recorrentes (ex.: "acesso livre", "convidados") com o time jurídico antes de campanhas em massa.
