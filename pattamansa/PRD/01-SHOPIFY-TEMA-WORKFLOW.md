# 01 — Shopify Tema: Workflow Seguro

## Pasta do Tema

```
shopify-theme/
```

Essa é a única fonte de verdade para o front-end da loja. Toda edição de tema deve ocorrer dentro dessa pasta.

---

## Loja e Tema de Trabalho

| Item | Valor |
|---|---|
| Store | `unmtvj-cr.myshopify.com` |
| Theme ID de trabalho | `181827076397` |
| Nome do tema | PattaMansa Permanente Preview |
| Tema live (não mexer) | Horizon (live theme da loja) |

---

## Comandos Seguros

### Verificar erros no tema
```bash
shopify.cmd theme check --path shopify-theme
```

### Listar temas da loja
```bash
shopify.cmd theme list --store unmtvj-cr.myshopify.com
```

### Subir tema para preview
```bash
shopify.cmd theme push --path shopify-theme --store unmtvj-cr.myshopify.com --theme 181827076397 --json
```

> Sempre usar `--theme 181827076397`. Nunca omitir o ID — isso evita subir para o tema errado.

---

## Comandos Proibidos

```bash
# PROIBIDO — publica em produção sem validação
shopify.cmd theme publish

# PROIBIDO — sobe alterações sem especificar tema
shopify.cmd theme push --path shopify-theme
```

Nunca rodar `theme publish` sem autorização explícita do usuário.
Nunca mexer no tema live (Horizon) diretamente.
Nunca subir alteração sem validar no preview.

---

## Preview Shopify

O preview do tema depende de cookie de sessão Shopify. Para visualizar:

```
https://unmtvj-cr.myshopify.com?preview_theme_id=181827076397
```

Esse link ativa o preview no browser. Sem o cookie, o site exibe o tema live (Horizon), não o tema de trabalho.

**Importante:** o link de preview não é a loja real. A loja real exibe o tema live até que se faça publish.

---

## Checklist Pós-Push

Após cada `theme push`, validar no preview antes de reportar conclusão:

- [ ] Push retornou sucesso sem erros no JSON
- [ ] `theme check` sem erros críticos
- [ ] Preview carrega no browser com o tema correto
- [ ] Seção alterada aparece como esperado
- [ ] Nenhuma seção adjacente quebrou
- [ ] Mobile renderiza corretamente
- [ ] Carrinho funciona (variantes preservadas)

---

## Fluxo Completo de Trabalho

```
1. Editar arquivo(s) em shopify-theme/
2. Rodar: shopify.cmd theme check --path shopify-theme
3. Corrigir erros antes de continuar
4. Rodar: shopify.cmd theme push --path shopify-theme --store unmtvj-cr.myshopify.com --theme 181827076397 --json
5. Validar no preview
6. Fazer commit no Git
7. Reportar ao usuário
```

Nunca pular etapas. Nunca ir direto para commit sem validar no preview.
