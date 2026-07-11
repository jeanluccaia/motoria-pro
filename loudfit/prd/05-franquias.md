# 05 — Franquias

**Última atualização:** 2026-07-11
**Responsável:** Time de expansão LoudFit
**Status:** Parcial — dados comerciais em validação jurídica e financeira

---

## Resumo

Documento da estratégia de expansão por franquias da LoudFit. Reúne a estrutura da página `/franquias` já publicada, o funil de captação e as condições comerciais informadas. Todos os números comerciais listados são **estimativas** e precisam de validação jurídica (COF, Lei de Franquias) e financeira antes de qualquer material impresso, apresentação institucional oficial ou anúncio pago em massa.

Fontes: `src/app/franquias/page.tsx`, `src/components/sections/QualifyForm.tsx`, `src/app/api/franquia-leads/route.ts`, dados comerciais informados pelo time.

---

## Perfil do franqueado (site atual)

Retirado da página `/franquias` e do formulário `QualifyForm`:

- Perfil empreendedor.
- Capital disponível para investimento (formulário aceita `até R$ 200 mil`, `R$ 200–400 mil`, `R$ 400–600 mil`, `acima de R$ 600 mil`).
- Não precisa ter experiência prévia em academia (FAQ oficial: "Preciso entender de academia para ser franqueado? Não. O playbook cobre gestão, operação e equipe.").
- Pode ou não ter ponto comercial em vista (campo `ja_tem_ponto` no formulário).
- Prazo para investir: `agora`, `3 meses` ou `6 meses ou mais`.

`PENDENTE DE CONFIRMAÇÃO`: perfil ideal detalhado (idade, background profissional, cidades prioritárias) — hoje não está formalizado no repositório.

---

## Proposta de valor

Blocos oficialmente veiculados na página `/franquias`:

1. **Marca que atrai** — "Identidade premium que já tem reconhecimento nas praças onde operamos."
2. **Aceleração LoudFit** — "Sua unidade não abre vazia. Metodologia própria de captação pré e pós-inauguração."
3. **Playbook completo** — "Gestão, operação, marketing e captação documentados. Não reinventa a roda."
4. **Suporte contínuo** — "Time de expansão, operação e marketing ao lado da sua unidade desde o dia 1."

Fonte: `src/app/franquias/page.tsx` (constante `diferenciais`).

---

## Etapas do funil

Fluxo veiculado no site (constante `steps`):

| # | Etapa | Ação |
| - | ----- | ---- |
| 01 | Preencheu o formulário | Nossa equipe recebe e analisa seu perfil. |
| 02 | Call de qualificação | Conversa de 30 minutos para entender perfil e praça. |
| 03 | Apresentação completa | Números, modelo de operação e tour nas unidades. |
| 04 | Análise de praça | Estudo do ponto e aprovação da localização. |
| 05 | Assinatura e kick-off | Contrato assinado. Aceleração LoudFit começa. |

---

## CTA e formulário

- **CTA principal:** "Quero ser franqueado" (âncora `#formulario`).
- **CTA secundário:** "Ver investimento" (âncora `#investimento`).
- **CTA WhatsApp:** "Falar com a equipe de expansão" apontando para o WhatsApp da Vila Industrial com mensagem pré-preenchida ("Quero falar com a equipe de expansão da Loud Fit").

Formulário `QualifyForm.tsx` (client component, react-hook-form + zod):

| Campo | Regra |
| ----- | ----- |
| `nome` | ≥ 2 caracteres. Obrigatório. |
| `whatsapp` | ≥ 10 caracteres. Obrigatório. |
| `email` | Formato de e-mail. Obrigatório. |
| `cidade_interesse` | ≥ 2 caracteres. Obrigatório. |
| `capital_disponivel` | Enum via `select`: `ate_200k`, `200_400k`, `400_600k`, `acima_600k`. |
| `ja_tem_ponto` | Checkbox booleano. |
| `prazo_investimento` | Radio `agora` / `3m` / `6m+`. |

Ao enviar:

1. `POST /api/franquia-leads` (validação zod duplicada em `route.ts`).
2. Se `FRANCHISE_LEAD_WEBHOOK_URL` estiver setada, envia via webhook.
3. Caso contrário, envia para Supabase (`submitLeadFranquia`) — tabela `leads_franquia` com `status: 'novo'`.
4. Sucesso → `router.push('/obrigado')`.
5. Falha → exibe mensagem + fallback com WhatsApp e e-mail (`vilaindustrial@loudfit.com.br`).

`origem` do lead é o `document.referrer` no cliente ou `'direto'`.

---

## Confirmação de envio

Página `/obrigado`:

- Texto: "OK. Recebemos seu contato. Nosso time de expansão vai analisar o seu perfil e entrar em contato em até **48 horas úteis**."
- `robots: noindex` (não deve aparecer em busca).
- CTAs: "Voltar ao início" e "Saber mais sobre franquias".

---

## Rastreamento (planejado)

`NÃO LOCALIZADO NO REPOSITÓRIO` — o formulário não dispara pixel/GA4/GTM hoje. Ver `08-marketing-e-rastreamento.md`.

Eventos que devem ser incluídos no plano:

- `page_view` (`/franquias`, `/obrigado`).
- `franchise_lead` no envio bem-sucedido (`route.ts` → sucesso).
- `click_whatsapp` no botão "Falar com a equipe de expansão".

---

## Diferenciais oficiais

Frases oficiais no site:

- "Uma rede de academias com operação real, modelo comercial validado e suporte para expansão."
- "O Brasil é o 2º maior mercado fitness do mundo e ainda cresce ~10% ao ano."
- "Fontes: IHRSA / ACAD Brasil. Dados de mercado de referência pública."

---

## Objeções antecipadas (FAQ do site)

`src/app/franquias/page.tsx` → constante `faqItems`.

| Pergunta | Resposta oficial |
| -------- | ---------------- |
| Preciso entender de academia para ser franqueado? | Não. O playbook cobre gestão, operação e equipe. Você precisa de perfil empreendedor e capital disponível. |
| Qual o investimento total? | O investimento estimado parte de **R$ 700 mil + equipamentos importados**, com variação conforme cidade, ponto e estrutura. |
| Quanto tempo até abrir? | Em média 4 a 6 meses após a assinatura do contrato, dependendo da obra e do ponto. |
| A Loud Fit ajuda a encontrar o ponto? | Sim. Nosso time faz a análise de praça e dá parecer técnico sobre o ponto antes de qualquer comprometimento. |

---

## Estrutura atual da página `/franquias`

Sequência de seções (`src/app/franquias/page.tsx`):

1. **Hero** — H1 "Abra uma Loud Fit na sua região.", CTA "Quero ser franqueado" + "Ver investimento", chips: Operação real / Modelo recorrente / Suporte de expansão.
2. **Resumo do investimento** — card principal com **taxa promocional R$ 80 mil** + card secundário `Investimento estimado R$ 700 mil`, `Equipamentos parcelamento facilitado`, `Royalties 7% ao mês`, `Publicidade 2%`, `Área mínima 750 m²`. Rodapé em cinza claro: "Dados estimados. Payback médio: ~15 meses. Lucratividade estimada: 25–35%. Consulte o COF e a Lei de Franquias antes de assinar qualquer contrato."
3. **Por que agora** — Mercado + stats (2º, ~10%, baixa, +).
4. **O que está no modelo** — quatro cards (`diferenciais`).
5. **Unidades reais** — grade com `UnitCard` das unidades ativas.
6. **Aceleração LoudFit** — três fases (Antes da inauguração, Dia da inauguração, Primeiros 90 dias).
7. **Como funciona o processo** — cinco passos (`steps`).
8. **FAQ** — perguntas frequentes (`faqItems`).
9. **Formulário** — `QualifyForm`.

---

## Aceleração LoudFit

Programa apresentado no site como diferencial exclusivo:

- **Antes da inauguração** — captação de pré-alunos, lista de espera e ações de lançamento da praça antes de abrir a porta.
- **Dia da inauguração** — protocolo de abertura, presença do time LoudFit, cobertura de redes e primeiros alunos já no sistema.
- **Primeiros 90 dias** — acompanhamento intensivo de retenção, métricas e ajuste de operação para consolidar a base.

Este programa é usado como parte da proposta de valor. `PENDENTE DE CONFIRMAÇÃO`: existe playbook documentado internamente? Onde está armazenado?

---

## Melhorias planejadas

Levantadas em auditoria e conversas com o time (mas ainda não implementadas):

- Substituir o texto "Fontes: IHRSA / ACAD Brasil" por citação com link e ano.
- Incluir depoimentos reais de franqueados/gestores quando houver (`getTestimonials` já existe em `src/lib/supabase.ts`).
- Substituir os stats "2º", "~10%", "baixa", "+" por versões com atribuição direta.
- Adicionar um bloco de "Documentação enviada" (COF, contrato-padrão) para franqueados qualificados.
- Cobertura de tráfego pago com landing dedicada (variação da `/franquias`) — a decidir com o gestor de tráfego.
- Melhorar o hero de acordo com a `VISUAL_DIRECTION.md` (diagonal LoudFit e stats mais editoriais).

---

## Dados comerciais que exigem validação final

> **Todos os itens desta seção são estimativas comerciais e devem passar por validação jurídica e financeira antes de virarem material formalmente publicado.**

- **Taxa de franquia (10 primeiras unidades):** R$ 80.000 (valor promocional). Valor original: R$ 120.000.
- **Investimento estimado total:** a partir de R$ 700.000, mais equipamentos importados (parcelamento facilitado).
- **Equipamentos importados:** possibilidade de parcelamento — condições específicas a formalizar.
- **Royalties:** 7% ao mês (site atual).
- **Fundo de publicidade:** 2%.
- **Área mínima:** 750 m².
- **Payback médio estimado:** 15 meses.
- **Lucratividade estimada:** 25% a 35%.
- **Tempo para abrir:** 4 a 6 meses após assinatura.

Estes números aparecem no site com o disclaimer "Consulte o COF e a Lei de Franquias antes de assinar qualquer contrato." e devem ser sempre apresentados como estimativas.

`PENDENTE DE CONFIRMAÇÃO`: existe COF (Circular de Oferta de Franquia) atualizado? Onde está armazenado? Vinculado a qual advogado responsável?

---

## Programa "Aceleração LoudFit" (visão comercial)

Além da apresentação no site, esse programa deve ser detalhado internamente com:

- Escopo por fase.
- Responsáveis (LoudFit x franqueado).
- Timing (dias/semanas de cada ativação).
- KPIs de sucesso (matrículas na abertura, retenção 30/60/90).
- Materiais gerados (artes, scripts, treinamentos).

Este detalhamento operacional ainda `PENDENTE DE CONFIRMAÇÃO`.

---

## Próximas ações

- Confirmar validação jurídica e financeira dos números comerciais.
- Publicar / anexar o COF em versão auditada.
- Configurar `FRANCHISE_LEAD_WEBHOOK_URL` para envio automático dos leads a um destino confiável (ver `PENDENCIAS.md`).
- Estruturar rastreamento do funil `/franquias` (ver `08-marketing-e-rastreamento.md`).
- Preparar landing dedicada a tráfego pago (variação da `/franquias`).
- Formalizar documentação interna do programa **Aceleração LoudFit**.
- Preparar depoimentos reais de franqueados / gestores quando existirem.
