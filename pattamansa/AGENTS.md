# AGENTS.md — PattaMansa

## Identificação do Projeto

**Projeto:** PattaMansa
**Pasta obrigatória de trabalho:** `C:\Users\DELL\Desktop\jean IA\pattamansa`
**Proibido mexer fora dessa pasta.**

---

## Estrutura

| Pasta / Arquivo | Finalidade |
|---|---|
| `PRD/` | Documentação estratégica permanente do projeto |
| `shopify-theme/` | Tema Shopify — única fonte de verdade do front-end |
| `AGENTS.md` | Este arquivo — lido por todos os agentes antes de agir |

---

## Loja Shopify

| Item | Valor |
|---|---|
| Store | `unmtvj-cr.myshopify.com` |
| Tema de trabalho | PattaMansa Permanente Preview |
| Theme ID | `181827076397` |
| Preview URL | `https://unmtvj-cr.myshopify.com?preview_theme_id=181827076397` |
| Branch Git | `pattamansa-shopify-mainstore` |

---

## Regras de Trabalho

### Tema
- Nunca rodar `theme publish` sem autorização explícita do usuário.
- Nunca publicar produção sem validação de preview.
- Sempre subir alterações para o Theme ID `181827076397`, salvo nova orientação explícita.
- Sempre rodar `shopify theme check` antes de concluir qualquer alteração de tema.

### Variantes e Carrinho
- Preservar toda lógica de variantes sem fallback silencioso.
- Preservar seleção de modelo/cor/tamanho no carrinho.
- Preservar checkout Shopify nativo — nunca substituir ou redirecionar.

### Catálogo
- Nunca mexer no catálogo sem autorização explícita.
- Nunca arquivar, renomear, deletar ou alterar vendor/tag/handle de produto sem confirmação.

### Entrega
- Sempre gerar relatório final ao concluir uma tarefa.
- Sempre fazer commit ao final quando houver alteração aprovada.

---

## Documentação de Referência

- `PRD/00-DIRECIONAMENTO-PROJETO.md` — o que é a PattaMansa e escopo atual
- `PRD/01-SHOPIFY-TEMA-WORKFLOW.md` — comandos seguros e workflow de push/preview
- `PRD/02-BRAND-ASSETS-E-BANNERS.md` — direção visual e banners necessários
- `PRD/03-CHECKLIST-PREVIEW-PUBLICACAO.md` — checklist obrigatório antes de publicar
- `PRD/04-PENDENCIAS-CATALOGO.md` — pendências futuras de catálogo (não executar agora)
