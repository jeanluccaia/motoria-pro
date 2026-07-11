# 11 — Roadmap e backlog

**Última atualização:** 2026-07-11
**Responsável:** Comercial + Marketing + Desenvolvimento
**Status:** Consolidado — sujeito a revisão semanal

---

## Resumo

Roadmap consolidado das próximas entregas do ecossistema digital LoudFit, organizado por prioridade. O objetivo é servir como referência única para o time coordenar esforços e para o comercial acompanhar quando cada dor será resolvida.

- **P0 — Crítico:** impede matrícula, captação ou funcionamento básico.
- **P1 — Alta prioridade:** diretamente ligado à conversão e à aquisição.
- **P2 — Evolução:** melhoria de experiência, conteúdo, automação e expansão.
- **P3 — Futuro:** funcionalidades fora do MVP atual.

Cada item aparece com **ID**, **Item**, **Área**, **Prioridade**, **Impacto**, **Esforço**, **Dependência** e **Status**.

Legenda de status: `Planejado`, `Em progresso`, `Concluído`, `Bloqueado`.
Legenda de impacto: `Alto`, `Médio`, `Baixo`.
Legenda de esforço: `S` (≤ 1 dia), `M` (1 semana), `L` (2–4 semanas), `XL` (mais que 1 mês).

---

## P0 — Crítico

| ID | Item | Área | Prioridade | Impacto | Esforço | Dependência | Status |
| -- | ---- | ---- | ---------- | ------- | ------- | ----------- | ------ |
| P0-01 | Validar todos os checkouts EVO nas seis unidades em navegador desktop e mobile (Chrome + Safari). | Desenvolvimento / Comercial | P0 | Alto | S | Nenhuma. | Planejado |
| P0-02 | Confirmar WhatsApp da Mogi Mirim com a unidade e alinhar em `officialUnitData`, `fallbackUnits` e `WhatsAppFloat`. | Operação | P0 | Alto | S | Contato com a unidade. | Planejado |
| P0-03 | Concluir aceite dos convites de Google Business Profile (Amoreiras, Anchieta, Vila Industrial). | Marketing | P0 | Alto | S | Franqueados aceitarem. | Em progresso |
| P0-04 | Finalizar validação de propriedade do GBP da Mogi Mirim (telefone ou vídeo). | Marketing | P0 | Alto | M | Aguardando validação Google. | Em progresso |
| P0-05 | Substituir o placeholder da `/politica-de-privacidade` por texto validado juridicamente. | Jurídico | P0 | Alto | M | Advogado. | Planejado |

---

## P1 — Alta prioridade

| ID | Item | Área | Prioridade | Impacto | Esforço | Dependência | Status |
| -- | ---- | ---- | ---------- | ------- | ------- | ----------- | ------ |
| P1-01 | Preencher dados completos e Google Maps URL de cada unidade após conclusão do GBP. | Marketing | P1 | Alto | M | P0-03, P0-04. | Planejado |
| P1-02 | Preencher grade oficial de aulas coletivas de Anchieta SP e Ipiranga (hoje `modalidades: []`). | Operação | P1 | Alto | S | Time das unidades. | Planejado |
| P1-03 | Confirmar propriedade do GBP da Ipiranga. | Marketing | P1 | Alto | S | Google. | Em progresso |
| P1-04 | Implementar campanha Day Use MVP (landing `/day-use`, formulário, escolha da unidade, envio ao Supabase, `/day-use/obrigado`). | Marketing + Desenvolvimento | P1 | Alto | L | `06-campanha-day-use.md` aprovado. | Planejado |
| P1-05 | Configurar rastreamento base (GTM + GA4 + `page_view`). | Marketing + Desenvolvimento | P1 | Alto | M | Gestor de tráfego. | Planejado |
| P1-06 | Implementar eventos comerciais (`view_unit`, `select_unit`, `click_enroll`, `begin_checkout`, `generate_lead`, `click_whatsapp`). | Marketing + Desenvolvimento | P1 | Alto | M | P1-05. | Planejado |
| P1-07 | Instalar Pixel Meta e API de Conversões para o formulário de franquia. | Marketing + Desenvolvimento | P1 | Alto | M | P1-05. | Planejado |
| P1-08 | Configurar `FRANCHISE_LEAD_WEBHOOK_URL` ou definir Supabase como destino oficial dos leads de franquia. | Comercial | P1 | Alto | S | Definir provedor. | Planejado |
| P1-09 | Substituir `/hero.mp4` por vídeo institucional oficial (desktop + mobile + poster). | Marca + André | P1 | Alto | M | Vídeo pronto. | Planejado |
| P1-10 | Página `/sobre`: substituir placeholders dos fundadores por fotos oficiais. | Marca | P1 | Médio | S | Fotos oficiais. | Planejado |
| P1-11 | Confirmar apontamento do domínio `loudfit.com.br`; atualizar `NEXT_PUBLIC_CANONICAL_URL`. | TI + Desenvolvimento | P1 | Alto | S | Registro/DNS. | Planejado |
| P1-12 | Validar deep-link do EVO para pré-seleção de plano no checkout. | Comercial + W12/EVO | P1 | Médio | M | Resposta do EVO. | Planejado |

---

## P2 — Evolução

| ID | Item | Área | Prioridade | Impacto | Esforço | Dependência | Status |
| -- | ---- | ---- | ---------- | ------- | ------- | ----------- | ------ |
| P2-01 | Substituir fotos genéricas por fotos oficiais por unidade (fachada + interior + coletivas). | Marca | P2 | Alto | L | Sessão de fotos. | Planejado |
| P2-02 | Coletar e publicar depoimentos reais de alunos por unidade. | Marca + Operação | P2 | Médio | M | Aluno aceitar. | Planejado |
| P2-03 | Melhorias visuais no hero da `/franquias` conforme `VISUAL_DIRECTION.md`. | Desenvolvimento | P2 | Médio | S | Nenhuma. | Planejado |
| P2-04 | Revisar a área de planos para maior clareza (badges, hierarquia, mobile). | Desenvolvimento | P2 | Médio | M | Nenhuma. | Planejado |
| P2-05 | Organizar atendimento via WhatsApp com script de recepção e prazos de resposta. | Operação | P2 | Alto | M | Manual. | Planejado |
| P2-06 | Adicionar `<track>` de legenda e poster otimizado ao `BrandVideo`. | Acessibilidade | P2 | Médio | S | Vídeo definitivo. | Planejado |
| P2-07 | Implementar consentimento LGPD com bloqueio condicional de scripts. | Jurídico + Desenvolvimento | P2 | Alto | M | Política definitiva. | Planejado |
| P2-08 | Ativar Google Ads e/ou Meta Ads com base em UTMs padronizadas. | Marketing | P2 | Alto | M | P1-05, P1-06. | Planejado |
| P2-09 | Rodar auditoria de acessibilidade (Axe) e corrigir issues críticos. | Desenvolvimento | P2 | Médio | M | Nenhuma. | Planejado |
| P2-10 | Melhorar SEO on-page das páginas de unidade (schema, breadcrumbs, alt tags). | Desenvolvimento | P2 | Médio | M | Nenhuma. | Planejado |
| P2-11 | Preparar landing dedicada a tráfego pago de franquia (variação `/franquias`). | Marketing | P2 | Médio | M | P1-05. | Planejado |
| P2-12 | Documentar internamente o programa Aceleração LoudFit (playbook por fase). | Expansão | P2 | Médio | L | Comercial. | Planejado |
| P2-13 | Ativar chat via GBP (mensagens direcionadas ao WhatsApp da unidade). | Marketing | P2 | Médio | S | GBP com acesso. | Planejado |
| P2-14 | Ampliar página `/carreiras` com estrutura mínima de vaga individual. | RH + Desenvolvimento | P2 | Baixo | M | RH definir vagas. | Planejado |
| P2-15 | Adicionar bandeira "canonical" para `loudfit.com.br` quando o domínio ativar. | Desenvolvimento | P2 | Médio | S | P1-11. | Planejado |

---

## P3 — Futuro

| ID | Item | Área | Prioridade | Impacto | Esforço | Dependência | Status |
| -- | ---- | ---- | ---------- | ------- | ------- | ----------- | ------ |
| P3-01 | Criar página `/resultados` (transformações, dados agregados por unidade). | Marca | P3 | Médio | L | Dados. | Planejado |
| P3-02 | Criar página `/comunidade` (eventos, tour por unidades, mural de fotos). | Marca | P3 | Médio | L | Conteúdo. | Planejado |
| P3-03 | Blog LoudFit (`/blog`) com conteúdo de rotina de treino e nutrição. | Marketing | P3 | Médio | XL | Time de conteúdo. | Planejado |
| P3-04 | Painel interno para acompanhar campanhas Day Use e leads em tempo real. | Marketing + Desenvolvimento | P3 | Médio | XL | Fase 3 do Day Use. | Planejado |
| P3-05 | Voucher Day Use com QR Code e leitura na recepção. | Marketing + Desenvolvimento | P3 | Alto | L | Day Use MVP. | Planejado |
| P3-06 | Retargeting via Meta para leads Day Use incompletos. | Marketing | P3 | Médio | M | Day Use MVP + tracking. | Planejado |
| P3-07 | Programa de indicação para alunos ativos ("Traga um amigo"). | Comercial | P3 | Médio | L | Comercial. | Planejado |
| P3-08 | App mobile ou PWA para o aluno. | Desenvolvimento | P3 | Alto | XL | Roadmap comercial. | Planejado |
| P3-09 | Publicar vagas em `/carreiras/[slug]` com formulário próprio. | RH + Desenvolvimento | P3 | Baixo | M | Volume de vagas. | Planejado |

---

## Regras de priorização

- **P0 nunca convive com sprint de features novas** — quando surgir um P0, ele entra na frente.
- **P1 é o combustível do funil**: um P1 novo só entra se destravar conversão.
- **P2 e P3** entram no ciclo trimestral e podem ser reavaliados.
- **Todo item precisa passar pelo PRD**: se não estiver documentado aqui ou em outro documento do PRD, ele não deveria estar em execução.

---

## Próximas ações

- Reunião semanal (30 min) para revisar P0 e P1.
- Congelar P2 e P3 até que todos os P0 estejam concluídos.
- Atualizar este documento a cada release, com o Status real.
- Refletir cada item concluído em `12-pendencias-e-decisoes.md`.
