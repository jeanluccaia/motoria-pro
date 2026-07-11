# 04 — Planos e conversão

**Última atualização:** 2026-07-11
**Responsável:** Comercial LoudFit + Desenvolvimento
**Status:** Consolidado

---

## Resumo

Este documento descreve a tabela de planos padrão, a tabela específica da unidade **Ipiranga**, os checkouts EVO cadastrados por unidade, o fluxo de matrícula e os textos comerciais oficialmente usados no site. É a fonte de verdade para qualquer decisão sobre preço, oferta ou CTA de matrícula.

Regras imutáveis (ver `01-marca-e-posicionamento.md`):

- **R$ 9,90 aparece apenas no Power Anual Recorrente.**
- Preços, nomes dos planos, `checkoutUrl` de cada unidade, status das unidades, WhatsApps, horários, CNPJ e rotas **não podem ser alterados** sem autorização explícita.
- Não usar "sem fidelidade".
- Na Home, não expor preço específico da Ipiranga; usar "Depois, mensalidade conforme a unidade escolhida."

---

## Tabela padrão (Carrefour Valinhos, Amoreiras, Vila Industrial, Anchieta SP, Mogi Mirim)

Fonte: `src/lib/plans.ts` (`standardPlans`).

| Plano                       | Valor      | Badge         | Descrição |
| --------------------------- | ---------- | ------------- | --------- |
| Power Mensal                | R$ 149,90 /mês | `FLEXÍVEL`      | Mês a mês, sem cobrança automática e sem compromisso de longo prazo. |
| Power Mensal Recorrente     | R$ 139,90 /mês | `PRÁTICO`       | Cobrança automática todo mês. Você treina, a renovação é automática. |
| Power Semestral Recorrente  | R$ 129,90 /mês | `ECONOMIA`      | Seis meses de treino com mensalidade mais baixa que o plano mensal. |
| Power Anual Recorrente ⭐    | R$ 119,90 /mês | `MELHOR VALOR`  | Plano de 12 meses com cobrança mensal no cartão — sem travar o limite total do cartão. **Primeira mensalidade R$ 9,90.** |

Slug (`slug`) de cada plano: `power-mensal`, `power-mensal-recorrente`, `power-semestral-recorrente`, `power-anual-recorrente`. O plano destaque é o Power Anual Recorrente (`featured: true`).

Benefícios comuns exibidos nos cards e na página da unidade (`planBenefits`):

- Musculação
- Aulas coletivas inclusas
- Estrutura completa
- Acesso por reconhecimento facial

---

## Tabela Ipiranga

Fonte: `src/lib/plans.ts` (`ipirangaPlans`). Aplicada quando `getPlans('ipiranga')`.

| Plano                       | Valor      | Badge         |
| --------------------------- | ---------- | ------------- |
| Power Mensal                | R$ 199,90 /mês | `FLEXÍVEL`      |
| Power Mensal Recorrente     | R$ 189,00 /mês | `PRÁTICO`       |
| Power Semestral Recorrente  | R$ 179,90 /mês | `ECONOMIA`      |
| Power Anual Recorrente ⭐    | R$ 179,90 /mês | `MELHOR VALOR`  |

- Primeira mensalidade R$ 9,90 no Power Anual Recorrente.
- Ipiranga usa tabela própria (`getPlans('ipiranga')`). Na Home, essa diferença é abstraída via mensagem "Depois, mensalidade conforme a unidade escolhida."

---

## Condições e diferenciais

- Primeira mensalidade **R$ 9,90** aplicada apenas ao Power Anual Recorrente (padrão e Ipiranga).
- Aulas coletivas inclusas em todos os planos.
- Plano anual **recorrente** — cobrança mensal no cartão, **não** trava limite integral.
- Condições podem variar por unidade (a Ipiranga já varia oficialmente).
- Convidados: até 5 acessos por titular (regra comercial oficial).
- Aula experimental grátis (musculação, cardio, aulas coletivas).
- Reconhecimento facial para entrada nas unidades.
- Matrícula online via checkout EVO.

`PENDENTE DE CONFIRMAÇÃO`: existência de fidelidade contratual explícita nos planos mensais/anuais (a marca **não** deve usar o termo "sem fidelidade").

---

## Fluxo atual de matrícula

Fluxo real implementado no site (`src/app/`):

1. Visitante acessa a Home (`/`).
2. Clica em "Encontrar minha unidade" ou usa a grade "Encontre sua LoudFit".
3. Vai para `/unidades/[slug]` da unidade escolhida.
4. Escolhe um plano na seção "Planos da unidade".
5. Clica em "Matricular online" (ou "Garantir matrícula online" para Ipiranga em pré-inauguração).
6. Vai para `/matricula/[slug]`.
7. Interage com o iframe EVO (`CheckoutFrame`) ou abre em nova aba.
8. Conclui matrícula dentro do checkout oficial EVO.

**Alternativas de contato durante o fluxo:**

- Botão "Falar com a unidade" abre WhatsApp da unidade (com mensagem pré-preenchida via `formatWhatsApp`).
- WhatsAppFloat (canto inferior direito) escancara as seis unidades e o link de franquia.
- CTAs paralelos apontam para `/#planos` e `/unidades`.

---

## Checkouts EVO por unidade

Fonte: `officialUnitData` em `src/lib/supabase.ts`. Passa por `normalizeEvoCheckoutUrl` em `src/lib/utils.ts` para preservar tokens `[PLUS] [BAR] [EQUAL]`.

| Unidade | Checkout EVO |
| ------- | ------------ |
| Carrefour Valinhos | `https://evo-totem.w12app.com.br/loudfit/1/site/%5BPLUS%5DeIL%5BPLUS%5DfzZNcy7Gt%5BBAR%5DPl5KIrQ%5BEQUAL%5D%5BEQUAL%5D` |
| Amoreiras | `https://evo-totem.w12app.com.br/loudfit/2/site/uRcgN1BLXvcYzmC%5BBAR%5DZHe3rg%5BEQUAL%5D%5BEQUAL%5D` |
| Anchieta SP | `https://evo-totem.w12app.com.br/loudfit/3/site/h%5BBAR%5DKEL8uI95qdrw2eJYudZQ%5BEQUAL%5D%5BEQUAL%5D` |
| Vila Industrial | `https://evo-totem.w12app.com.br/loudfit/4/site/7rlDfyRNEkamlvXH5WMvow%5BEQUAL%5D%5BEQUAL%5D` |
| Mogi Mirim | `https://evo-totem.w12app.com.br/loudfit/5/site/QhXXzoY7OMy%5BPLUS%5DFpULG15Wrw%5BEQUAL%5D%5BEQUAL%5D` |
| Ipiranga | `https://evo-totem.w12app.com.br/loudfit/6/site/0GaE9Ux52vXSBHXLH2E5hg%5BEQUAL%5D%5BEQUAL%5D` |

`PENDENTE DE CONFIRMAÇÃO` com W12/EVO: existência de **deep-link** oficial para pré-seleção de plano dentro do checkout (ver `PENDENCIAS.md`). Enquanto não houver, o iframe abre no início do fluxo do EVO.

---

## Mensagens comerciais oficiais no site

Sequência típica de textos que o visitante encontra:

- **Home Hero**: "O melhor ainda está por vir." + selo "1ª mensalidade R$9,90 · Power Anual Recorrente*" + CTA "Encontrar minha unidade" + "Ver planos".
- **PlansSection (Home)**: cards com nome, badge, valor, descrição, benefícios. O card Anual mostra o rótulo `PRIMEIRA MENSALIDADE POR R$9,90`.
- **Página da unidade**:
  - Card lateral: "Matrícula online. Primeira mensalidade por R$9,90. No Power Anual Recorrente."
  - Ipiranga em pré-inauguração: "Unidade em inauguração. Garanta sua matrícula online antes da abertura."
  - Nota abaixo dos cards: "Após a primeira mensalidade promocional, aplica-se o valor mensal do Power Anual Recorrente desta unidade. Os demais planos seguem o valor cheio desde a primeira cobrança."
- **Página de matrícula**: "Aulas coletivas já inclusas no seu plano. Muay Thai, Pilates, Spinning, FitDance e mais — sem custo adicional." + selos ("Checkout oficial EVO", "Dados registrados no sistema da academia", "Pagamento seguro", "Aulas coletivas já inclusas no plano").
- **Modalidades**: "Tudo isso já está no seu plano. 16 modalidades inclusas na mensalidade, sem custo por aula." + "A grade pode variar por unidade."

---

## Riscos de encaminhar o cliente para checkout errado

- **Cada unidade tem seu próprio checkout EVO** — a matrícula é vinculada à unidade correta. Encaminhar para o link errado gera cadastro em outra academia.
- O painel `WhatsAppFloat` também segmenta por unidade — anúncios devem sempre linkar a página `/unidades/[slug]` correspondente, nunca a Home genérica.
- Em campanhas com destino direto ao checkout, usar sempre o `checkoutUrl` da unidade específica.
- Se um cliente escolher errado, o WhatsApp da unidade correta deve reencaminhar (regra operacional).

---

## Comportamento em mobile

- Iframe do EVO usa `CheckoutFrame` (ver `src/components/ui/CheckoutFrame.tsx`).
- Alguns navegadores mobile podem bloquear iframes de terceiros; por isso há sempre o CTA "Abrir checkout em nova aba" acima do iframe.
- Nunca depender apenas do iframe — sempre manter o link externo visível.
- Testar em Chrome/Safari (iOS e Android). Ver checklist visual em `10-requisitos-tecnicos.md`.

---

## WhatsApp de apoio (durante conversão)

Cada página de matrícula e cada página de unidade tem um botão "Falar com a unidade" que abre o WhatsApp da unidade com mensagem pré-preenchida:

`Olá, quero tirar uma dúvida sobre a unidade [Nome] da Loud Fit.`

Fonte: `formatWhatsApp` em `src/lib/utils.ts`.

---

## Eventos de conversão esperados

`NÃO LOCALIZADO NO REPOSITÓRIO` — nenhum evento comercial (Pixel Meta, GA4, GTM) foi identificado no código atual. Ver `08-marketing-e-rastreamento.md`.

Eventos que **devem** ser implementados quando o rastreamento entrar em produção (sujeitos a validação com o gestor de tráfego):

- `page_view` (padrão)
- `view_unit` (visita à página `/unidades/[slug]`)
- `select_unit` (clique em um card de unidade)
- `view_plan` (impressão dos cards de plano)
- `click_enroll` (clique em "Matricular online" ou "Garantir matrícula online")
- `begin_checkout` (entrada no iframe do EVO ou clique em "Abrir checkout em nova aba")
- `generate_lead` (envio bem-sucedido do formulário de franquia)
- `click_whatsapp` (clique em qualquer WhatsApp — separar unidade x franquia)
- `franchise_lead` (equivalente ao `generate_lead` mas do funil de franquia)
- `day_use_start`, `day_use_submit`, `day_use_redeem` (para a campanha de Day Use — ver `06`)

---

## Localização dos links (para desenvolvedores)

- **Nomes e preços dos planos:** `src/lib/plans.ts`.
- **Checkouts EVO por unidade:** `src/lib/supabase.ts` → `officialUnitData` (e `fallbackUnits` como espelho).
- **Fluxo da página de matrícula:** `src/app/matricula/[slug]/page.tsx`.
- **Iframe do checkout:** `src/components/ui/CheckoutFrame.tsx`.
- **Mensagens do card lateral da unidade:** `src/app/unidades/[slug]/page.tsx`.

Qualquer link não encontrado nessas fontes deve ser marcado como `NÃO LOCALIZADO NO REPOSITÓRIO`.

---

## Próximas ações

- Validar deep-link oficial do EVO para pré-selecionar plano (`PENDENCIAS.md`).
- Preparar plano de eventos de conversão em conjunto com o gestor de tráfego (`08-marketing-e-rastreamento.md`).
- Definir com o comercial se surgirão novos planos ou condições sazonais.
- Cruzar a tabela Ipiranga com o material comercial local (a marca informou preço distinto — validar cronograma).
- Escrever um script curto de recepção para o time das unidades ("como orientar cliente que veio pelo site").
