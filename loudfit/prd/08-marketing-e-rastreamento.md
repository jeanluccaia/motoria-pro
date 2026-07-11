# 08 — Marketing e rastreamento

**Última atualização:** 2026-07-11
**Responsável:** Gestor de tráfego LoudFit (a nomear) + Desenvolvimento
**Status:** Planejamento — infraestrutura de rastreamento **não implementada** no repositório atual

---

## Resumo

Este documento descreve a infraestrutura esperada de marketing digital para a LoudFit: perfis e contas nas plataformas, ferramentas de rastreamento, eventos, UTMs, consentimento e integrações. **Nenhuma parte do rastreamento (Pixel Meta, GA4, GTM, API de Conversões) foi encontrada no código atual.** Este é o inventário do que precisa ser configurado, não do que já existe.

Fontes usadas:

- Repositório atual (`src/`, `AGENTS.md`, `docs/`).
- Recursos externos citados em `README.md` e memória do projeto.

---

## Infraestrutura esperada

| Plataforma | Uso | Estado atual |
| ---------- | --- | ------------ |
| **Meta Business Manager** | Conta unificada da rede LoudFit. | `PENDENTE DE CONFIRMAÇÃO` — não confirmado no repositório. |
| **Páginas de Instagram/Facebook por unidade** | Presença por unidade + roteamento de ads. | Página oficial `@loudfit` referenciada no Footer. Por unidade: apenas `@loudfit.vilaindustrial` localizada. |
| **Contas de anúncio (Meta)** | Uma por unidade ou uma centralizada com estrutura por unidade. | `PENDENTE DE CONFIRMAÇÃO`. |
| **Pixel da Meta** | Rastreamento de eventos padrão + custom. | `NÃO LOCALIZADO NO REPOSITÓRIO`. |
| **API de Conversões (Meta)** | Envio server-side (Fluid Compute) para complementar o Pixel. | `NÃO LOCALIZADO NO REPOSITÓRIO`. |
| **Google Analytics 4** | Análise comportamental. | `NÃO LOCALIZADO NO REPOSITÓRIO`. |
| **Google Tag Manager** | Contêiner central para tags. | `NÃO LOCALIZADO NO REPOSITÓRIO`. |
| **Google Ads** | Ads de busca + performance. | `PENDENTE DE CONFIRMAÇÃO`. |
| **Conversions (Google Ads)** | Ligado ao GA4. | `PENDENTE DE CONFIRMAÇÃO`. |
| **UTMs padronizadas** | Rastreamento de origem/canal/campanha. | `PENDENTE DE CONFIRMAÇÃO`. |
| **Consentimento LGPD** | Banner + escopo do consentimento. | `NÃO LOCALIZADO NO REPOSITÓRIO`. |
| **Formulários** | Franquia (`QualifyForm`). | Implementado (`src/components/sections/QualifyForm.tsx` + `/api/franquia-leads`). |
| **WhatsApp** | Atendimento por unidade + expansão. | Implementado (`WhatsAppFloat.tsx`). |
| **Checkouts EVO** | Matrícula. | Implementado (`officialUnitData` em `src/lib/supabase.ts`). |
| **Google Business Profile** | Ficha local. | Em processo. Ver `07-google-business-profile.md`. |

---

## Matriz de eventos

Eventos que devem ser padronizados no site e nas campanhas. Nomes recomendados (a validar com o gestor de tráfego — quando existirem nomes no projeto, respeitar):

| Evento | Momento | Plataforma | Parâmetros | Status |
| ------ | ------- | ---------- | ---------- | ------ |
| `page_view` | Toda navegação. | GA4 + Meta | `page_path`, `page_title`. | `PENDENTE DE IMPLEMENTAÇÃO`. |
| `view_unit` | Entrou em `/unidades/[slug]`. | GA4 + Meta | `unit_slug`, `unit_name`, `unit_status`. | `PENDENTE`. |
| `select_unit` | Clique em um `UnitCard`. | GA4 + Meta | `unit_slug`, `source_page`. | `PENDENTE`. |
| `view_plan` | Impressão de um `PlanCard`. | GA4 | `plan_slug`, `plan_price`, `unit_slug`. | `PENDENTE`. |
| `click_enroll` | Clique em "Matricular online". | GA4 + Meta | `plan_slug`, `unit_slug`. | `PENDENTE`. |
| `begin_checkout` | Entrada em `/matricula/[slug]` ou clique em "Abrir checkout em nova aba". | GA4 + Meta (`InitiateCheckout`) | `unit_slug`, `plan_slug` (se conhecido). | `PENDENTE`. |
| `generate_lead` | Envio bem-sucedido do formulário `/api/franquia-leads`. | GA4 + Meta (`Lead`) | `capital_range`, `prazo`, `ja_tem_ponto`. | `PENDENTE`. |
| `click_whatsapp` | Qualquer clique em WhatsApp. | GA4 + Meta | `whatsapp_source` (`unit-header`, `unit-detail`, `float`, `franchise`), `unit_slug` (se aplicável). | `PENDENTE`. |
| `franchise_lead` | Sinônimo específico do funil de franquia (se preferirem separar). | GA4 + Meta | Igual ao `generate_lead`. | `PENDENTE`. |
| `day_use_start` | Início do formulário de Day Use. | GA4 + Meta | `unit_slug`, `utm_source`, `utm_medium`, `utm_campaign`. | `PLANEJAMENTO`. |
| `day_use_submit` | Envio do formulário de Day Use. | GA4 + Meta | Mesmo do `day_use_start`. | `PLANEJAMENTO`. |
| `day_use_redeem` | Voucher marcado como usado na recepção. | Backend + GA4 (medição via GA4 Measurement Protocol). | `unit_slug`, `voucher_id`, `data_uso`. | `PLANEJAMENTO`. |

Regras gerais:

- Os nomes acima são **propostos**. Se o gestor de tráfego já tiver convenção diferente, adotar essa convenção e atualizar este documento.
- Cada evento deve carregar UTMs quando disponíveis.
- Cada evento deve ter o `unit_slug` sempre que aplicável para permitir corte por unidade.

---

## Padrão de UTMs

Recomendação (a validar):

| Parâmetro | Uso |
| --------- | --- |
| `utm_source` | Nome da plataforma (`meta`, `google`, `instagram`, `whatsapp`, `email`, `orgânico`, `indicação`). |
| `utm_medium` | Tipo de mídia (`cpc`, `social`, `organic`, `email`, `direct`, `messaging`). |
| `utm_campaign` | Nome da campanha (`dayuse-2026-08`, `matricula-primeiro-plano`, `franquia-expansao`). |
| `utm_content` | Variante criativa (`carrossel-1`, `video-1`, `banner-topo`). |
| `utm_term` | Palavra-chave (Google Ads) ou público (Meta). |

Regras:

- Sempre em minúsculas.
- Separadores com hífen `-`, nunca espaço ou underscore.
- Nunca reaproveitar `utm_campaign` entre campanhas distintas.

---

## Consentimento (LGPD)

Ainda não implementado no repositório. Recomendação (a validar com jurídico):

- Banner de consentimento visível na primeira visita.
- Categorias: **necessário**, **estatística**, **marketing**.
- Não disparar Pixel Meta / GA4 antes do consentimento na categoria correspondente.
- Manter registro do aceite com timestamp para auditoria.

Detalhes de LGPD específicos ao formulário de franquia:

- Texto atual do formulário: "Seus dados são usados apenas para contato da equipe Loud Fit. Nada de spam."
- Recomenda-se adicionar link para `/politica-de-privacidade` (que ainda é placeholder).

---

## Formulários

- **`/api/franquia-leads`** — a implementação atual retorna `{ ok: true, destination: 'webhook' | 'supabase' }`. O disparo do evento `generate_lead` deve ocorrer **após** a resposta bem-sucedida, tanto no lado do cliente (`QualifyForm.tsx`) quanto no lado servidor (via Meta Conversion API), garantindo dedup por `event_id`.

`PENDENTE`: definir `event_id` compartilhado e envio server-side.

---

## WhatsApp

- Cada clique em WhatsApp deve disparar `click_whatsapp` com o parâmetro `whatsapp_source`. Origens conhecidas hoje no site:
  - Painel flutuante (`WhatsAppFloat`) → `whatsapp_source: float`.
  - Página da unidade (`Falar com a unidade`) → `whatsapp_source: unit-detail`.
  - Página de matrícula (`Falar com a unidade`) → `whatsapp_source: matricula`.
  - Página `/franquias` (`Falar com equipe de expansão`) → `whatsapp_source: franchise`.
  - Fallback do formulário de franquia (mensagem de erro) → `whatsapp_source: franchise-fallback`.
  - Footer → `whatsapp_source: footer`.

---

## Checkouts EVO

- Não há acesso direto aos eventos do EVO. Nossa medição para (rastreando o site LoudFit).
- Como proxy para conversão de matrícula, considerar `begin_checkout` como métrica-fim quando não houver retorno da EVO.
- **Idealmente:** validar com W12/EVO se existe callback ou webhook para "matrícula concluída". `PENDENTE DE CONFIRMAÇÃO`.

---

## Google Business Profile e marketing

- Perfis GBP alimentam a busca local. Ver `07-google-business-profile.md`.
- Publicações regulares no GBP são recomendadas para SEO local.
- Avaliações devem ser respondidas em até 48 horas úteis (mesmo padrão do e-mail).

---

## Prioridade de implementação

1. **GTM instalado** no `src/app/layout.tsx` (uma vez).
2. **GA4 disparando `page_view`** via GTM.
3. **Pixel Meta** disparando `PageView` e `ViewContent` via GTM.
4. **Eventos comerciais** (`view_unit`, `select_unit`, `click_enroll`, `begin_checkout`, `generate_lead`, `click_whatsapp`).
5. **API de Conversões (Meta)** — via rota API do Next.js (Fluid Compute) para envio server-side com `event_id` compartilhado.
6. **Conversion do Google Ads** ligada ao `generate_lead` e ao `begin_checkout`.
7. **Consentimento LGPD** com bloqueio condicional dos gatilhos anteriores.

---

## O que não fazer

- Não disparar eventos com dados pessoais em texto claro (usar hash SHA-256 para e-mail e telefone quando aplicável — CAPI Meta exige).
- Não misturar contadores automáticos de teste (Debug View) com produção.
- Não usar UTMs inconsistentes entre anúncios da mesma campanha.
- Não confiar apenas no Pixel Meta client-side em iOS 14.5+ — sempre replicar via CAPI.
- Não considerar clique em WhatsApp como matrícula.

---

## Não afirmar que uma integração está ativa sem verificar no código

Este documento parte da premissa de que nenhuma integração de rastreamento está ativa hoje. Antes de comunicar qualquer status para stakeholders, revalidar no repositório: se em algum momento aparecerem tags em `src/app/layout.tsx`, arquivos em `src/lib/analytics/`, um handler no `route.ts`, ou variáveis `NEXT_PUBLIC_META_PIXEL_ID` / `NEXT_PUBLIC_GA4_ID` / `GTM_ID`, atualizar este documento.

---

## Próximas ações

- Definir gestor de tráfego responsável e conta administradora da Meta/Google.
- Criar contêiner GTM e ID do GA4.
- Instalar GTM no `src/app/layout.tsx`.
- Estabelecer padrão de UTMs por escrito.
- Implementar consentimento LGPD.
- Configurar Meta CAPI para o formulário de franquia e para a campanha Day Use.
- Definir dashboards (Meta Ads Manager + GA4 + Looker) para acompanhamento semanal.
- Cruzar eventos com origem por unidade.
