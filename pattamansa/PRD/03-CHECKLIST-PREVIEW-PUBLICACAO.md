# 03 — Checklist de Preview e Publicação

## Regra Principal

**Nunca publicar sem aprovação explícita do usuário.**

O `theme push` envia para preview (Theme ID `181827076397`). O `theme publish` coloca em produção. São operações diferentes. Nunca rodar `theme publish` sem instrução direta.

---

## Checklist Pré-Publicação

Todos os itens abaixo devem estar marcados antes de qualquer publicação em produção.

### Header
- [ ] Logo correto da PattaMansa exibindo (não placeholder, não texto "Minha loja")
- [ ] Menu com links corretos e funcionando
- [ ] Carrinho abre corretamente
- [ ] Header responsivo no mobile

### Home
- [ ] Nenhuma mensagem padrão Shopify ("Welcome to our store", "Powered by Shopify" visível indevidamente)
- [ ] Hero com imagem real (não placeholder cinza)
- [ ] Seções editoriais com conteúdo real
- [ ] Sem referências a Copa do Mundo, futebol, seleção
- [ ] CTA em laranja funcionando

### Footer
- [ ] Footer premium com identidade da marca
- [ ] Newsletter em português do Brasil
- [ ] Links institucionais corretos (Política de Privacidade, Trocas, Contato)
- [ ] Sem "Minha loja" ou textos padrão Shopify

### Conteúdo Geral
- [ ] Sem "Preço normal R$0,00" em qualquer produto visível
- [ ] Sem placeholders de texto ("Lorem ipsum", "Descrição do produto")
- [ ] Sem imagens de placeholder (quadrado cinza)
- [ ] Sem referências a Copa do Mundo, seleção, futebol

### Mobile
- [ ] Home validada no mobile (375px e 390px)
- [ ] Header mobile funcional (menu hamburguer abre)
- [ ] Hero mobile com imagem correta (não cortada de forma estranha)
- [ ] Cards e seções responsivos

### Produto (PDP)
- [ ] Variantes (modelo/cor/tamanho) aparecem corretamente
- [ ] Seleção de variante atualiza imagem e preço
- [ ] Variante esgotada sinaliza claramente (sem "Add to cart" ativo para esgotado)
- [ ] Tabela de medidas presente

### Carrinho e Checkout
- [ ] Adicionar ao carrinho funciona
- [ ] Carrinho preserva modelo/cor/tamanho selecionados
- [ ] Checkout abre corretamente
- [ ] Formas de pagamento aparecem (Pix, cartão, boleto)
- [ ] Cálculo de frete funciona

### Checklist Final
- [ ] `shopify theme check` sem erros críticos
- [ ] Todos os itens acima validados no preview
- [ ] Aprovação explícita do usuário recebida
- [ ] Somente após tudo isso: rodar `theme publish`

---

## Preview URL

```
https://unmtvj-cr.myshopify.com?preview_theme_id=181827076397
```

Abrir esse link no browser antes de reportar qualquer item como concluído.

---

## O que Fazer se Algo Falhar

1. Não publicar com erro.
2. Documentar o item que falhou.
3. Corrigir no tema local.
4. Rodar `theme check` novamente.
5. Fazer novo push para preview.
6. Validar de novo.
7. Só reportar como concluído após validação.
