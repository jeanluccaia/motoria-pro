# Arquitetura — Loud Flow (MVP enxuto)

**Versão:** 1.0
**Data:** 2026-08-05
**Complementa:** [[prd-loud-flow]]

Regra editorial: **arquitetura enxuta**. A estrutura permite evoluir depois, mas nada além do MVP é implementado agora.

---

## 1. Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | **Next.js 16 (App Router)** | Padrão do repo Loud Fit; Server Components ótimo para dashboards |
| Linguagem | **TypeScript strict** | Menos bug em painel que sócios olham |
| UI | **Tailwind + shadcn/ui** | Consistente com Loud Fit, controle total do markup, visual premium com pouco esforço |
| Banco | **Supabase Postgres** | RLS nativo + Auth + Storage num só produto |
| Auth | **Supabase Auth — magic link** | Sem senha; setup mínimo |
| Storage | **Supabase Storage** | Só para avatar do usuário no MVP (tarefa não tem anexo) |
| Jobs | **Vercel Cron** (1x/dia) | Basta pro MVP |
| LLM (opcional) | **Vercel AI Gateway → Anthropic Haiku 4.5** | Se quisermos resumo automático no Início; barato |
| Deploy | **Vercel** | Padrão do repo; Fluid Compute; preview URL por PR |
| Email | **Resend** | Notificação básica de tarefa nova/aprovação pendente |
| Observabilidade | **Vercel Observability + Sentry (free tier)** | Suficiente para MVP |

**O que não entra no MVP** (mas é fácil somar depois): Vercel Queues, KV/Redis, real-time via Supabase Realtime, AI Gateway para recomendação de tarefa.

## 2. Topologia

```
    Usuário ─▶  gestao.loudfit.com.br
                    │
                    ▼
    ┌───────────────────────────────────────┐
    │  Next.js 16 (App Router, Fluid)       │
    │  • RSC + Server Actions               │
    │  • Route handlers /api/*              │
    └───────────────────────────────────────┘
             │                        │
             ▼                        ▼
    ┌─────────────────┐      ┌────────────────────┐
    │ Supabase        │      │ Vercel Cron        │
    │ • Postgres+RLS  │      │ • sync-utmify      │
    │ • Auth (magic)  │      │   (uma vez/dia)    │
    │ • Storage       │      └─────────┬──────────┘
    └─────────────────┘                │
                                       ▼
                              ┌────────────────────┐
                              │ UTMify API pública │
                              │ (leitura, token)   │
                              └────────────────────┘
             │
             ▼
    ┌──────────────┐
    │   Resend     │  (email básico)
    └──────────────┘
```

Tudo gerenciado. Nada de infra própria. Sem EVO — nenhuma seta para fora além de UTMify e Resend.

## 3. Estrutura de pastas

```
app/
  (auth)/login/page.tsx
  (app)/
    layout.tsx                # shell autenticado (sidebar/bottom nav)
    page.tsx                  # / — Início
    tarefas/
      page.tsx                # lista + kanban (toggle)
      _components/task-drawer.tsx
    resultados/
      page.tsx                # painel
      _components/card.tsx
    config/
      page.tsx                # abas: usuários, unidades, mapeamento
  api/
    cron/sync-utmify/route.ts # cron diário

lib/
  supabase/                   # client server/browser
  auth/                       # RBAC helpers
  integrations/utmify/        # adapter tipado da API pública
  metrics/                    # cálculos simples (comparação período)
  audit/

components/
  ui/                         # shadcn
  painel/                     # cards com apelidos amigáveis
  tarefas/                    # kanban, lista, drawer, form

supabase/
  migrations/                 # SQL versionado
  seed/                       # 1 org Loud Fit + 5 unidades + Anchieta arquivada + 1 admin

vercel.ts                     # config (cron, headers)
```

Sem monorepo, sem workspaces. Um app só.

## 4. Multi-tenancy (leve mas correto)

- `organization_id NOT NULL` em toda tabela de negócio.
- RLS por organização e por unidade.
- Nenhuma UI multi-org no MVP (login → cai direto na única organização).

Se um dia virar franquia: adicionar mais linhas em `organizations`, sem refactor.

## 5. RLS (padrão simples)

Cada tabela tem 3 políticas base:

```sql
-- leitura por membro da org
create policy read_org on <table> for select
  using (organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  ));

-- escrita: admin ou marketing
create policy write_org on <table> for insert, update, delete
  using (organization_id in (
    select organization_id from user_organizations
    where user_id = auth.uid() and role in ('admin','marketing')
  ));

-- filtro extra para unit_manager (só nas tabelas com unit_id)
create policy unit_scope on tasks for select
  using (
    case
      when exists (
        select 1 from user_organizations
        where user_id = auth.uid()
          and role = 'unit_manager'
          and organization_id = tasks.organization_id
      )
      then unit_id in (select unit_id from user_units where user_id = auth.uid())
      else true
    end
  );
```

Teste Playwright cobre 3 cenários negativos antes do deploy.

## 6. Camada de integração — só UTMify

Adapter em `lib/integrations/utmify/`:

- Token de API guardado em `integrations.credentials_encrypted` (pgcrypto).
- Só admin lê/edita em `/config`.
- Cliente HTTP simples com tipos gerados a partir da documentação/prova.

Endpoints do MVP (a validar no Spike 0.1):
- Listar dashboards.
- Resumo do dashboard (totais).
- Meta Ad Objects nível campanha por período.
- Google Ad Objects nível campanha por período (quando o pagamento voltar).

Cron `sync-utmify` (uma vez por dia, 03:00 BRT):

```
1. Para cada organization ativa:
2.   Ler token.
3.   Para cada conta ativa no dashboard:
4.     Buscar meta ad objects (campaign) para o dia anterior.
5.     Upsert em campaign_snapshots (source='utmify').
6.     Atribuir unit_id parseando nome (regra em [[integracao-utmify]] §6).
7.   Registrar sync_run.
```

Sem materialização adicional no MVP: `/resultados` roda query direta em `campaign_snapshots` com filtros. Nesse volume, é instantâneo.

## 7. Atribuição de unidade

Regra: **terceiro token** do nome separado por ` | ` (case-insensitive, sem acento). Se não bater com nenhum alias em `unit_aliases`, `unit_id = NULL` e aparece em `/config → Mapeamento` para admin corrigir manualmente.

Aliases seed:
```
"amoreiras", "mogi mirim", "ipiranga", "vila industrial",
"carrefour valinhos", "carrefour", "vila", "tour ipiranga" → ipiranga
```

Correção manual salva na tabela → sync futuro respeita a correção.

## 8. Painel de resultados

Regra editorial dura: métricas sem fonte confiável mostram exatamente **"Não disponível"** com tooltip *"Depende de fonte externa não integrada nesta versão"*.

Métricas do MVP:
- ✅ Investido, alcance/impressões, cliques, leads, checkouts, custo por clique, custo por lead, custo por checkout.
- ⛔ Matrículas, faturamento atribuído, custo por matrícula, ROAS, ROI — todas "Não disponível". Nunca zero, nunca deduzir.

Comparação com período anterior é cálculo simples no server: mesmo intervalo deslocado.

## 9. Deploy e ambientes

| Ambiente | Domínio | Branch |
|---|---|---|
| local | `localhost:3000` | qualquer |
| preview | Vercel `*.vercel.app` | qualquer PR |
| produção | `gestao.loudfit.com.br` | `main` |

Segredos em `vercel env`. Nunca commitados. `vercel.ts` declara o cron:

```ts
// vercel.ts (a criar na implementação)
import type { VercelConfig } from '@vercel/config/v1';
export const config: VercelConfig = {
  framework: 'nextjs',
  crons: [{ path: '/api/cron/sync-utmify', schedule: '0 6 * * *' }], // 03:00 BRT
};
```

## 10. Segurança

- Magic link com rate limit (Vercel Firewall) nas rotas de auth.
- RLS em todas as tabelas de negócio, sem exceção.
- Segredos só em `vercel env` e Supabase Vault.
- Vercel BotID no login.
- PII mínima: email e nome (sem CPF, sem telefone).

## 11. Observabilidade

- Vercel Observability (latência, erros por rota).
- Sentry free tier.
- `sync_runs` visível em `/config` para admin (últimos 30).
- Email para admin quando `sync_runs.status='error'`.

## 12. Custo estimado

| Serviço | Mensal |
|---|---|
| Vercel Pro | US$ 20 |
| Supabase Pro | US$ 25 |
| Resend | US$ 0 |
| Sentry free | US$ 0 |
| **Total** | **~US$ 45** |

Sem billing de usuário. Sem AI Gateway obrigatório no MVP (opcional para resumo do Início).

## 13. Ordem de construção (recap com fases enxutas)

```
Fase 0  Spike 0.1 UTMify (só documentação, sem código de produto)
Fase 1  Auth + org/unit/user + RLS + config usuários
Fase 2  Tarefas (CRUD, lista, kanban, comentário, histórico, aprovação simples)
Fase 3  Integração UTMify + painel /resultados + /config mapeamento
Fase 4  Página /início consolidada + polish visual
```

Detalhes em [[mvp-e-fases]].

---

## Referências cruzadas

- PRD: [[prd-loud-flow]]
- UTMify (integração + Spike 0.1): [[integracao-utmify]]
- Fases: [[mvp-e-fases]]
