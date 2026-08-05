# MVP e Fases — Loud Flow

**Versão:** 1.0 — MVP enxuto
**Data:** 2026-08-05
**Complementa:** [[prd-loud-flow]], [[arquitetura-loud-flow]], [[integracao-utmify]]

Este documento define **ordem e escopo** de cada fase. Datas dependem do time.

> **Direção editorial (2026-08-05):** MVP simples, bonito, rápido, funcional. Prioridade é a equipe usando de verdade. Não construir agora nada que o MVP não precisa. Sem EVO. Sem sistema robusto.

---

## Fase 0 — Spike 0.1 (só validação, sem código de produto)

**Único spike** desta versão. **Sem Spike 0.2** — EVO fora do escopo.

**Spike 0.1 — API pública da UTMify**

Itens:
- Autenticação (tipo de token, header, escopo)
- API pública disponível (base URL, versão)
- Endpoints necessários (dashboards, resumo, meta ad objects, google ad objects)
- Métricas retornadas em cada endpoint
- Filtros suportados (dateRange, contas, level)
- Contas acessíveis com o token
- Campanhas retornadas e cobertura por unidade
- Rate limits reais
- Delay real (dado do dia X aparece quando?)
- Sincronização diária (janela recomendada)
- Custos e limitações do plano da UTMify

Entrega: `docs/spikes/utmify-api.md` com respostas reais e checklist. **Grande parte já foi consolidada** com base no MCP (ver [[integracao-utmify]] §2).

**Pendência técnica** — o spike NÃO está encerrado até que, com credencial real da API pública, sejam confirmados:
- Base URL
- Autenticação
- Endpoints
- Paginação
- Rate limit
- Custo ou exigência de plano

Critério de saída: consigo puxar campaign objects do dia anterior por HTTPS autenticado (sem MCP), com token novo, e a checklist acima está marcada.

**Bloqueio:** essa pendência bloqueia **somente a Fase 3**. **Não bloqueia** o início da Fase 1 nem da Fase 2.

---

## Fase 1 — Alicerce (auth + org/unidades/usuários + RLS + `/config` + direção visual)

**Objetivo:** consigo criar usuários, atribuir papéis, RLS impede acesso cross-tenant/cross-unidade. **A direção visual da Loud Fit já é estabelecida aqui** — Fase 4 será só refinamento e PWA, não conserto de UI mal planejada.

**Entregas:**
- Setup do Supabase (projeto, magic link, storage bucket para avatar).
- Migrations: `organizations`, `units`, `users`, `user_organizations`, `user_units`, `audit_log`.
- RLS em todas essas tabelas.
- Tela `/login` (magic link).
- Tela `/config` com abas Usuários e Unidades (aba Mapeamento vira ativa na Fase 3).
- Seed: 1 org "Loud Fit", 5 unidades ativas + Anchieta arquivada, 1 admin.
- Shell autenticado (sidebar desktop / bottom nav mobile).

**Direção visual estabelecida já na Fase 1:**
- Identidade premium e minimalista da Loud Fit (paleta, tipografia, densidade).
- Componentes consistentes via shadcn/ui com tema custom da marca.
- Navegação extremamente simples (poucas ações visíveis por vez).
- Excelente experiência **mobile e desktop** desde o primeiro commit.
- Sem animações pesadas.
- Estados de loading, vazio e erro já bonitos e coerentes (não placeholders quadrados).

**Critério de saída:**
- `admin` cria `unit_manager` da Ipiranga → esse usuário loga e vê shell vazio; não consegue entrar em `/tarefas` de outra unidade via URL.
- Playwright cobre 3 cenários de RLS negativos.

---

## Fase 2 — Tarefas (CRUD + lista + kanban + comentário + aprovação simples)

**Objetivo:** time transfere trabalho de WhatsApp para o Loud Flow no mesmo dia do rollout.

**Entregas:**
- Migrations: `tasks`, `task_comments`, `task_history`.
- Tela `/tarefas` com toggle **Lista | Kanban**.
- Kanban com 4 colunas: A fazer, Em andamento, Aguardando aprovação, Concluída.
- Modal / drawer de criar/editar tarefa: título, descrição, responsável, unidade, prazo, prioridade, status.
- Comentários simples (texto + autor + data).
- Histórico básico (criada, mudou de status, concluída — quem e quando).
- Marcar como concluída (registra `completed_at`).
- Filtros: responsável, unidade, status.
- Fluxo de aprovação: `marketing` marca "requer aprovação" → status vai para "Aguardando aprovação" → `partner` clica aprovar/recusar (aprovar sozinho, sem quórum).
- Notificação email básica (Resend): tarefa atribuída, comentário novo, aprovação pendente.
- Auditoria em `audit_log` para mudança de papel e config.

**Critério de saída:**
- `marketing` cria tarefa, atribui a `unit_manager` da Ipiranga, define prazo. Ele recebe email, muda para "Em andamento", comenta, marca "Aguardando aprovação". `partner` aprova sozinho. Tudo aparece no histórico da tarefa.
- Nenhum vazamento cross-unidade.

---

## Fase 3 — Integração UTMify + painel `/resultados` + mapeamento

**Objetivo:** sócio abre `/resultados` e vê o mês com investimento, cliques, leads, checkouts, com comparação simples.

**Depende de:** Spike 0.1 concluído com token real.

**Entregas:**
- Migrations: `campaigns`, `campaign_snapshots`, `integrations`, `sync_runs`, `unit_aliases`.
- Adapter `lib/integrations/utmify/` (só leitura).
- Cron `sync-utmify` 1x/dia às 03:00 BRT.
- Regra de atribuição por nome (ver [[integracao-utmify]] §3.2).
- Tela `/config` aba Mapeamento — lista campanhas em "Não atribuído", admin corrige.
- Tela `/config` aba Integrações — admin cola/rotaciona token da UTMify.
- Tela `/resultados`:
  - Cards com apelidos amigáveis (investido, alcance, cliques, leads, checkouts, custo por clique/lead/checkout).
  - Comparação com período anterior (seta ↑/↓ e diferença %).
  - Gráfico simples: investimento vs cliques por dia.
  - Filtros: período (hoje, 7d, 30d, mês atual, mês passado, custom), unidade, campanha.
  - Métricas de matrícula/faturamento/ROAS/ROI/custo por matrícula exibidas como **"Não disponível"** com tooltip.
- Rótulo global "Atualizado em <data do último sync>".

**Critério de saída:**
- Sync roda 5 dias seguidos sem intervenção manual.
- Números do painel batem com UTMify (mesma janela, mesmas métricas) em ± 1%.
- Cards "Não disponível" claros; nenhum "R$ 0" enganoso.
- Campanha "LF | VENDAS | AMOREIRAS | POWER PLUS | AGO26" aparece corretamente atribuída a Amoreiras.

---

## Fase 4 — `/início` + refinamento visual + PWA

**Objetivo:** tela de abertura resume o dia em 3 cards. **Refinar** o visual já estabelecido na Fase 1 e habilitar PWA. Fase 4 NÃO é o momento de consertar interface mal planejada — a direção visual foi estabelecida desde a Fase 1.

**Entregas:**
- Tela `/` (Início):
  - Card **Minhas tarefas de hoje** (título + prazo + link para o kanban).
  - Card **Tarefas atrasadas** (contador + top 5).
  - Card **Aprovações pendentes** (só `partner`/`admin`).
  - Card **Resumo do marketing** (3 números grandes: investido no mês, cliques, checkouts, com seta de tendência).
- Refinamento visual (não redesign): microinterações discretas, ajuste fino de espaçamento, empty states finais, revisão de contraste e legibilidade.
- PWA básico (installable, ícone, splash).

**Critério de saída:**
- Sócio abre no celular → em 30 segundos responde: "quanto investi, quantos cliques, quantos checkouts, o que precisa da minha atenção".
- Sem tutorial.

---

## Pós-MVP (não é MVP, backlog quando aparecer sinal de uso)

- Notificação WhatsApp (WhatsApp Cloud API).
- Trackear conversas iniciadas por WhatsApp.
- Real-time no painel do dia atual.
- Anexos em tarefa.
- Playbooks / templates automáticos de processo.
- Subtarefas, dependências, tarefas recorrentes.
- Calendário completo de campanhas.
- Controle de carga da equipe.
- IA para gerar tarefas ou sugerir próximos passos.
- Editor visual de playbook.
- Aprovações com quórum.
- Convite de agência com escopo limitado.
- Metas por unidade.
- Módulo de conteúdo orgânico.
- **Possibilidade futura:** integração com EVO ou fonte confiável de matrículas → desbloqueia "Custo por matrícula", "Faturamento", "ROAS", "ROI". Sem esforço previsto agora.

---

## Escopo do MVP (recap)

O MVP é Fase 1 + Fase 2 + Fase 3 + Fase 4.

**Entrega ao sócio:**
- Operação enxuta de tarefas com kanban, aprovação e histórico.
- Painel simples com investimento, alcance, cliques, leads, checkouts, custos derivados, comparação com período anterior, filtros por período/unidade/campanha.
- Tela inicial com resumo em 3 cards.

**Não entrega:**
- Nenhuma métrica que dependa de matrícula/faturamento.
- Nenhuma integração além da UTMify (leitura).
- Nenhum recurso além dos listados acima.

---

## Fora do escopo do MVP

- Integração EVO (e tudo que depende dela).
- WhatsApp (canal e tracking).
- Playbooks/templates, subtarefas, dependências, recorrência, anexos.
- Calendário completo.
- Gráficos operacionais complexos, controle de carga.
- Notificações in-app, push, WhatsApp.
- IA gerando tarefas.
- App nativo (PWA cobre).
- Multi-idioma.
- Aprovação com quórum.
- Editor visual de playbook.
- Integração direta Meta/Google (UTMify cobre).
- Billing.
- Login externo (agência).
- Regras automáticas em campanha (UTMify já faz).

---

## Riscos por fase

| Fase | Risco | Mitigação |
|---|---|---|
| 0 | API pública da UTMify não cobre o que o MCP mostra | Plano B: pedir suporte à UTMify; plano C (frágil): scraping do painel |
| 1 | RLS mal escrito vaza dado | Playwright cobrindo cenários negativos antes do merge |
| 2 | Time volta pro WhatsApp | Reunião de rollout + email de tarefa nova |
| 2 | Kanban carrega devagar com muita tarefa | Paginação simples por status + índice em `(organization_id, status, due_at)` |
| 3 | Nome de campanha fora do padrão faz atribuição errada | Aba Mapeamento + alerta admin quando taxa cair < 95% |
| 3 | Sócio se frustra com "Não disponível" | Tooltip claro + comunicado de rollout |
| 4 | Visual não fica premium suficiente | Reservar tempo real de polish; revisão com o Jean antes do release |

---

## Decisões (v1.0 — todas fechadas)

1. **Anchieta:** arquivada, só admin vê.
2. **Login:** magic link por email.
3. **EVO:** **fora do MVP.** Sem integração, sem spike, sem consulta a credenciais/API/webhooks. Possibilidade futura.
4. **Nomenclatura:** regra dura + UI de mapeamento em `/config`.
5. **WhatsApp:** fora do MVP.
6. **Google Ads:** dentro do MVP via UTMify (adapter resiliente enquanto conta fica pausada por pagamento).
7. **Franquias:** sem plano imediato; multi-tenant só na arquitetura.
8. **Aprovação:** sócio decide sozinho, sem quórum.
9. **Notificação:** só email básico.
10. **Tarefas e painel têm o mesmo peso** no MVP.
11. **Escopo tarefas:** enxuto (sem playbooks/anexos/subtarefas/recorrência/IA/dependências).
12. **Escopo painel:** só métricas UTMify realmente disponíveis; matrículas/faturamento/ROAS/ROI/custo por matrícula → "Não disponível".

Fase 0 (Spike 0.1) pode começar imediatamente (só documentação, sem código de produto). Fases 1 e 2 podem ser iniciadas em paralelo, sem esperar Spike 0.1. Fase 3 espera Spike 0.1.

---

## Referências cruzadas

- PRD: [[prd-loud-flow]]
- Arquitetura: [[arquitetura-loud-flow]]
- UTMify: [[integracao-utmify]]
