# 00 — Visão geral

**Última atualização:** 2026-07-11
**Responsável:** Jean Lucca
**Status:** Consolidado

---

## Resumo executivo

A LoudFit é uma rede de academias em expansão no interior e capital de São Paulo, com seis unidades cadastradas no ecossistema digital (Carrefour Valinhos, Amoreiras, Vila Industrial, Anchieta SP, Mogi Mirim e Ipiranga). A operação digital cobre:

- Um site institucional e comercial em Next.js (App Router) publicado em `loudfit.vercel.app`.
- Um fluxo de matrícula online que direciona o visitante para um checkout **EVO** específico da unidade escolhida.
- Uma página de captação de franqueados.
- Perfis (a padronizar) no **Google Business Profile** para cada unidade.
- Presença institucional em Instagram.
- WhatsApps operacionais por unidade e um WhatsApp central de expansão.

A operação atual roda como marca única mesmo quando há particularidades por unidade (ex.: tabela de preços da Ipiranga, materiais próprios, calendário de aulas, ex-loja Pano Bianco no ponto físico).

---

## Momento atual do projeto

- **Site funcional em produção** (`loudfit.vercel.app`) com Home, Unidades, Franquias, Sobre, Modalidades, Carreiras, Contato, Política de Privacidade e páginas dinâmicas `/unidades/[slug]` e `/matricula/[slug]`.
- **Home reformulada** com hero editorial, grade de unidades resumida, planos comerciais, seção de aulas coletivas, banner de expansão e CTA final.
- **Checkouts EVO das seis unidades** presentes no fallback em `src/lib/supabase.ts`.
- **Página de franquias** publicada com condições comerciais em texto, formulário de qualificação, funil visual e FAQ.
- **Dados oficiais das unidades** foram parcialmente saneados em 2026-07-09 (endereços e WhatsApps). Ver `docs/google-business-profile/google-business-profile-audit.md`.
- **Perfis GBP em processo de padronização**: um com acesso, quatro com convite pendente e dois casos especiais (Mogi Mirim e Ipiranga).
- **Site é a fonte principal de conversão**; a base de aluno (Supabase) não é obrigatória para o site funcionar — há fallback de dados no repositório.

---

## Objetivos digitais

O ecossistema digital LoudFit tem cinco objetivos prioritários:

1. **Captar leads qualificados** para matrícula e para franquia.
2. **Converter matrículas online** via checkout EVO de cada unidade.
3. **Direcionar o cliente para a unidade correta** (evitando checkout errado e atendimento cruzado).
4. **Fortalecer a marca LoudFit** — energia, atitude, resultado, comunidade.
5. **Apoiar a expansão por franquias** com uma página comercial séria e um formulário de qualificação.

Como consequência dos cinco, existem dois objetivos operacionais transversais:

- **Organizar a presença digital das unidades** (site, Google Business Profile, redes sociais, WhatsApp).
- **Melhorar o rastreamento** (pixel, eventos, GA4, GTM, API de Conversões) para que decisões comerciais sejam baseadas em dado.

---

## Problemas que o projeto resolve

- Falta de padronização entre unidades (dados diferentes por canal).
- Dispersão do fluxo de matrícula (visitante não sabia qual checkout usar).
- Perfis GBP legados no nome do negócio anterior (Pano Bianco).
- Comunicação genérica que não vendia a experiência real da LoudFit (musculação + aulas coletivas no mesmo plano).
- Ausência de material centralizado sobre marca, planos e expansão para novos colaboradores e franqueados.

---

## Públicos envolvidos

| Público | Interesse principal | Página / canal preferido |
| ------- | ------------------- | ------------------------ |
| Interessado em matrícula (cliente) | Encontrar unidade, preço, matricular. | Home → Unidades → Matrícula ou WhatsApp da unidade. |
| Aluno atual da unidade | Grade de aulas, horários, conversar com a unidade. | Página da unidade + WhatsApp. |
| Interessado em franquia | Investimento, retorno, praças disponíveis. | `/franquias` + WhatsApp de expansão. |
| Recepção / atendimento das unidades | Receber leads corretos, orientar o cliente. | WhatsApp da unidade. |
| Time interno (marketing, expansão) | Consistência de dados, campanhas, funil. | PRD + GBP + Meta + GA4 (`PENDENTE DE CONFIRMAÇÃO`). |
| Novo colaborador | Entender a marca e o momento. | Este PRD. |

---

## Metas principais

Metas de referência para o próximo ciclo (a formalizar com o time comercial). Ordem de prioridade:

1. **Padronizar dados operacionais** das seis unidades no site, GBP e canais oficiais.
2. **Aumentar a taxa de conversão em matrículas** via reforço do fluxo Home → Unidade → Checkout.
3. **Aumentar o volume de leads qualificados de franquia** com uma página de expansão mais forte.
4. **Cobrir todas as unidades com material próprio** (fotos, vídeo, horários confirmados).
5. **Ativar rastreamento** (Pixel Meta, GA4, GTM, API de Conversões) — hoje `NÃO LOCALIZADO NO REPOSITÓRIO`.
6. **Rodar a campanha Day Use** de forma unificada para toda a rede.

Meta numérica específica: `PENDENTE DE CONFIRMAÇÃO` com o time comercial da LoudFit.

---

## Canais de aquisição

Canais em operação hoje (do que foi possível confirmar no repositório e nos documentos legados):

- **Orgânico** — busca por marca e por unidade (Google + Google Maps).
- **Meta / Instagram** — perfil `@loudfit` referenciado no footer e artes de referência descritas em `VISUAL_DIRECTION.md`. Conta de anúncio não confirmada no repositório.
- **WhatsApp direto** — número por unidade (seis) + número da expansão (Vila Industrial, `(19) 98829-1946`).
- **Google Business Profile** — cada unidade com perfil próprio, em processo de padronização.
- **Base própria** — futura, ainda não implementada.
- **Referência boca a boca** — presencial nas unidades.

Canais planejados / a validar:

- **Google Ads** — `PENDENTE DE CONFIRMAÇÃO` se existe conta ativa.
- **API de Conversões (Meta)** — planejada, ainda não implementada.
- **Campanha Day Use** — ver `06-campanha-day-use.md`.

---

## Jornada geral do cliente (matrícula)

Fluxo comercial que a Home suporta hoje:

```
Anúncio ou orgânico
  ↓
Home (/)
  ↓
Grade "Encontre sua LoudFit" (Home) OU página /unidades
  ↓
Página da unidade (/unidades/[slug])
  ↓
Seção de planos da unidade
  ↓
Página de matrícula (/matricula/[slug])
  ↓
Checkout EVO da unidade (iframe/nova aba)
  ↓
Conversão
```

**Pontos de fricção conhecidos:**

- WhatsApp flutuante precisa separar atendimento por unidade de interesse em franquia — hoje já faz isso via painel próprio (`WhatsAppFloat.tsx`).
- Iframe do EVO pode não renderizar em alguns navegadores mobile — CTA "Abrir checkout em nova aba" está presente na página de matrícula.
- Página de Ipiranga tem tabela de preços diferente das demais e status `em_breve`. O checkout já existe.

---

## Jornada geral do interessado em franquia

```
Anúncio ou orgânico
  ↓
Página /franquias
  ↓
Hero + resumo do investimento
  ↓
"Por que agora", "O que está no modelo", "Aceleração LoudFit", processo, FAQ
  ↓
Formulário de qualificação (QualifyForm)
  ↓
API interna /api/franquia-leads
  ↓
Envio para webhook externo (se FRANCHISE_LEAD_WEBHOOK_URL estiver setado)
OU envio para Supabase (`leads_franquia`) como fallback
  ↓
Redirecionamento para /obrigado
  ↓
Contato do time de expansão em até 48h úteis (mensagem no /obrigado)
```

**Pontos de fricção conhecidos:**

- `FRANCHISE_LEAD_WEBHOOK_URL` `NÃO LOCALIZADO NO REPOSITÓRIO` como valor configurado — leads dependem do Supabase estar configurado.
- Fallback exibido ao usuário quando o envio falha: mostra WhatsApp e e-mail `vilaindustrial@loudfit.com.br`.
- Campos comerciais da página (`R$ 80 mil taxa promocional`, `R$ 700 mil investimento`, `royalties 7%`, `publicidade 2%`, `área mínima 750 m²`, `payback 15 meses`, `lucratividade 25%–35%`) precisam de validação jurídica e financeira antes de virarem material publicado formalmente. Ver `05-franquias.md`.

---

## Próximas ações

- Confirmar metas numéricas com o time comercial (matrículas/mês, leads de franquia/mês, unidades novas/ano).
- Confirmar canais ativos (Meta Ads, Google Ads).
- Fechar padronização dos dados operacionais das seis unidades (ver `03-unidades.md`).
- Definir o responsável pelo rastreamento (ver `08-marketing-e-rastreamento.md`).
- Confirmar cronograma da campanha Day Use com a operação (ver `06-campanha-day-use.md`).
