# PRD — Loud Flow (MVP enxuto)

**Versão:** 1.0 — direção definitiva do MVP
**Data:** 2026-08-05
**Autor:** Jean Lucca + Claude
**Status:** Aguardando aprovação para iniciar implementação
**Domínio previsto:** `gestao.loudfit.com.br` (privado)

---

## 1. Visão

O **Loud Flow** é o sistema interno da rede **Loud Fit**. Começa **simples, bonito, rápido e funcional**, com o objetivo de colocar a equipe usando de verdade no menor tempo possível. Evoluímos depois com base em uso real, não em suposição.

Duas frentes no MVP:

1. **Tarefas** — o time para de perder trabalho no WhatsApp.
2. **Resultados de marketing** — o sócio vê investimento e retorno *disponível* em pt-BR claro.

## 2. Problema resolvido

- Trabalho de marketing hoje vive em conversa de WhatsApp — perde-se contexto e prazo.
- Sócio não consegue ler painéis de Meta Ads / UTMify — quer resposta simples em português.
- Gestor de unidade vê dado de outra unidade ou dado nenhum.

## 3. Perfis de usuário

| Perfil | O que faz |
|---|---|
| `admin` | Configura sistema, usuários e integrações. Acesso completo. |
| `marketing` | Cria e edita tarefas. Vê tudo. |
| `partner` (sócio) | Vê resultados, aprova tarefas que exigem aprovação, comenta. |
| `unit_manager` | Vê e executa tarefas da própria unidade. Vê o painel da própria unidade. |

## 4. Permissões (resumo)

| Recurso | admin | marketing | partner | unit_manager |
|---|---|---|---|---|
| Tarefas — criar/editar | ✅ | ✅ | comentar | próprias |
| Tarefas — ver todas | ✅ | ✅ | ✅ | só da própria unidade |
| Aprovar tarefa | ✅ | — | ✅ | — |
| Painel de rede | ✅ | ✅ | ✅ | — |
| Painel de unidade | ✅ | ✅ | ✅ | só da própria unidade |
| Config (usuários, unidades, mapeamento) | ✅ | — | — | — |

Isolamento por unidade e por organização é feito no banco (RLS), não só na UI.

## 5. Unidades

Ipiranga, Amoreiras, Mogi Mirim, Vila Industrial, Carrefour Valinhos. **Anchieta** fica arquivada (só admin vê).

## 6. Módulos do MVP

### 6.1 Tarefas

**Campos da tarefa:**
- Título
- Descrição (texto simples com Markdown básico)
- Responsável (1 pessoa)
- Unidade (obrigatório — pode ser "rede" para tarefas globais)
- Prazo (data)
- Prioridade (baixa, média, alta)
- Status (A fazer, Em andamento, Aguardando aprovação, Concluída)
- Comentários simples (texto + autor + data)
- Histórico básico (criada, mudou de status, concluída — quem e quando)

**Ações:**
- Criar tarefa
- Editar tarefa
- Comentar
- Mudar status
- Marcar como concluída

**Visualizações:**
- Lista (com ordenação por prazo, prioridade, status)
- Kanban simples com 4 colunas (A fazer / Em andamento / Aguardando aprovação / Concluída)

**Filtros:**
- Responsável
- Unidade
- Status

**Fora do MVP** (para não pesar):
- Dependências entre tarefas
- Subtarefas
- Tarefas recorrentes
- Anexos
- Templates/playbooks automáticos
- Controle de carga da equipe
- Notificações avançadas (só email básico)
- IA para gerar tarefas
- Fluxos configuráveis
- Calendário completo de campanhas
- Gráficos operacionais

### 6.2 Resultados de marketing (painel)

Fonte única: **UTMify** (via API pública, sync diária). Sem EVO.

**Cards principais** (com apelidos amigáveis):
- "Quanto foi investido" (spend)
- "Quantas pessoas foram alcançadas" (alcance/impressões — o que a UTMify entregar de melhor)
- "Quantos cliques" (clicks)
- "Quantos leads" (leads)
- "Quantos checkouts" (initiate checkout)
- "Custo por clique"
- "Custo por lead"
- "Custo por checkout"

**Comparação simples com o período anterior** — seta ↑ ou ↓ e diferença em %.

**Gráficos simples:** investimento vs cliques por dia/semana. Só o essencial.

**Filtros:**
- Período (hoje, 7 dias, 30 dias, mês atual, mês passado, custom)
- Unidade
- Campanha

**Métricas que ficam "Não disponível":**
- Matrículas
- Faturamento atribuído
- Custo por matrícula
- ROAS
- ROI

Regra dura: essas métricas **não** aparecem como "R$ 0" nem "0 matrículas". Aparecem com o texto **"Não disponível"** e um tooltip: *"Depende de fonte externa não integrada nesta versão"*. Nunca deduzir matrícula a partir de clique, lead ou checkout.

## 7. Páginas e navegação

Só 4 páginas no MVP.

```
/                                → Início
/tarefas                         → Tarefas (lista + kanban)
/resultados                      → Painel de marketing
/config                          → Usuários, unidades, mapeamento
/login                           → Login por magic link
```

### 7.1 `/` — Início

Um dashboard pessoal. Cards:
- **Minhas tarefas de hoje** (título + prazo, atalho para o kanban)
- **Tarefas atrasadas** (contador + lista)
- **Aprovações pendentes** (só aparece para `partner` e `admin`)
- **Resumo do marketing** (3 números grandes: investido no mês, cliques, checkouts, com seta de tendência)

### 7.2 `/tarefas`

Toggle no topo: **Lista** | **Kanban**.

Botão flutuante "+ Nova tarefa" abre modal com os campos.

Filtros no topo: responsável, unidade, status.

Clicar numa tarefa abre painel lateral (drawer) com detalhes, comentários e ações.

### 7.3 `/resultados`

Filtros no topo: período, unidade, campanha.

Grid de cards com apelidos amigáveis. Um gráfico simples embaixo. Métricas indisponíveis mostradas com "Não disponível".

### 7.4 `/config` (só admin)

Três abas:
- **Usuários** — lista, convidar, mudar papel, remover.
- **Unidades** — lista, editar nome, arquivar/reativar.
- **Mapeamento** — campanhas sem unidade atribuída, mapear manualmente.

## 8. Design

- **Visual premium e minimalista** da Loud Fit (paleta e tipografia consistentes com o site atual).
- Navegação extremamente simples — sidebar em desktop, bottom nav de 4 itens em mobile.
- Poucos elementos por tela — cada tela responde uma pergunta.
- Linguagem clara em português, sem jargão de marketing.
- Ótimo em desktop e celular.
- Sem animações pesadas.
- Sem tabelas gigantes; sem excesso de gráficos ou configurações.

## 9. Modelo de dados (enxuto)

```
organizations       (id, name, slug, timezone, currency)
units               (id, organization_id, name, slug, archived_at)
users               (id, email, name, avatar_url)
user_organizations  (user_id, organization_id, role)
user_units          (user_id, unit_id)                                -- só para unit_manager

tasks               (id, organization_id, unit_id?, title, description_md,
                     assignee_id, due_at, priority, status,
                     requires_approval, approved_at, approved_by,
                     created_by, created_at, updated_at, completed_at)
task_comments       (id, task_id, author_id, body, created_at)
task_history        (id, task_id, actor_id, event, from_status?, to_status?, created_at)

campaigns           (id, organization_id, unit_id?, external_id, name, channel, status)
campaign_snapshots  (id, campaign_id, snapshot_date, spend_cents, impressions,
                     clicks, leads, initiate_checkouts, raw_json)
unit_aliases        (id, organization_id, alias, unit_id)             -- para atribuição

integrations        (id, organization_id, provider, credentials_encrypted, status, last_synced_at)
sync_runs           (id, integration_id, started_at, finished_at, status, rows_upserted, error)
audit_log           (id, organization_id, actor_id, action, target_type, target_id, created_at)
```

Sem `playbooks`, sem `playbook_steps`, sem `task_attachments`, sem `executive_daily`/`executive_summary` materializados no MVP (calcular direto do `campaign_snapshots` já resolve nesse volume). Se o painel ficar lento, materializamos depois.

## 10. Regras de negócio

1. Isolamento por organização e unidade via RLS no Postgres.
2. Auditoria mínima: `task_history` (visível na tarefa) + `audit_log` (técnico, admin).
3. Moeda em centavos (`int`), datas em `timestamptz` UTC, exibição em `America/Sao_Paulo`.
4. Métricas do painel são fechadas 1x/dia (sync noturno). Nada de real-time no MVP.
5. Métricas sem fonte confiável = **"Não disponível"**. Nunca zero. Nunca dedução.
6. Aprovação: um `partner` decide sozinho.

## 11. Integrações

Só **UTMify** (API pública, leitura, sync diária). Detalhes em [[integracao-utmify]].

**Nada** de EVO nesta versão — nem consulta, nem credenciais, nem endpoints, nem webhooks, nem provas técnicas.

## 12. Critérios de aceite do MVP

1. `admin` cria usuário `unit_manager` da Ipiranga; esse usuário só vê tarefas e painel da Ipiranga.
2. `marketing` cria uma tarefa, atribui, define prazo. Aparece no kanban e na lista. Comentário funciona. Mudança de status registra no histórico.
3. `partner` aprova tarefa em "Aguardando aprovação" com um clique.
4. Sync UTMify roda 5 dias seguidos sem intervenção.
5. Painel mostra investido/cliques/checkouts do mês corrente, com comparação com o mês anterior, filtrável por unidade e campanha.
6. Cards "Matrículas", "Faturamento" e "ROAS" mostram "Não disponível" com tooltip.
7. Nenhum vazamento cross-unidade (teste automatizado).

## 13. Riscos

| Risco | Mitigação |
|---|---|
| Sócio se frustra com "Não disponível" | Comunicado de rollout explicando; card claro; tooltip curto |
| Time volta pro WhatsApp | Email de tarefa nova + reunião de virada |
| Atribuição errada por nome de campanha | Tela `/config` mapeamento manual |
| Nome de campanha muda no meio do mês | Snapshot é diário; histórico preserva |
| Escopo cresce e sistema fica pesado | **Regra dura**: qualquer feature nova entra só após 30 dias de uso do MVP |

## 14. Decisões (v1.0 — todas fechadas)

1. **Anchieta:** arquivada.
2. **Login:** magic link por email.
3. **EVO:** **fora do MVP.** Sem integração, sem spike, sem consulta.
4. **Nomenclatura de campanha:** regra + UI de mapeamento manual.
5. **WhatsApp:** fora do MVP.
6. **Google Ads:** dentro do MVP via UTMify (adapter resiliente a dado zerado enquanto pagamento não resolve).
7. **Franquias:** sem plano imediato — multi-tenant fica só na arquitetura.
8. **Aprovação:** sócio decide sozinho.
9. **Notificação:** só email básico.
10. **Painel/tarefas — pesos:** **iguais**. Ambos obrigatórios no MVP.
11. **Escopo tarefas:** enxuto (ver §6.1) — sem playbooks, anexos, subtarefas, recorrência, IA.
12. **Escopo painel:** enxuto (ver §6.2) — só métricas UTMify realmente disponíveis.

## 15. Fora do MVP (recap)

- EVO e tudo que depende dela (matrículas, faturamento, ROAS, ROI, custo por matrícula).
- WhatsApp (canal e tracking).
- Playbooks/templates de tarefa, subtarefas, dependências, recorrência.
- Anexos em tarefas.
- Calendário completo de campanhas.
- Gráficos operacionais complexos e controle de carga.
- Notificações in-app, push, WhatsApp.
- IA gerando tarefas.
- App mobile nativo (PWA cobre).
- Multi-idioma.
- Aprovação com quórum.
- Editor visual de playbook.
- Integração direta Meta/Google (UTMify cobre).
- Billing.

---

## Referências cruzadas

- Arquitetura: [[arquitetura-loud-flow]]
- UTMify (integração + Spike 0.1): [[integracao-utmify]]
- Fases: [[mvp-e-fases]]
