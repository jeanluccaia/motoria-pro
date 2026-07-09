# 04 — Pendências de Catálogo

## Status

**Catálogo fora do escopo atual. Não alterar produtos agora.**

O catálogo da PattaMansa existe no Shopify com produtos das coleções Copa/futebol e algumas coleções permanentes. Ele precisa de revisão completa, mas essa revisão só ocorre após o tema estar aprovado e estável.

Nenhum agente deve alterar produtos, coleções, handles, vendors ou tags sem instrução explícita.

---

## O que Não Fazer Agora

- Não arquivar produtos
- Não deletar produtos
- Não renomear produtos
- Não alterar handle de produto
- Não alterar vendor
- Não alterar tags
- Não criar novas coleções
- Não modificar coleções existentes
- Não alterar estoque
- Não subir fotos novas via Admin Shopify
- Não mexer em metafields de produto

---

## Pendências Futuras (a executar quando o tema estiver aprovado)

### Produtos

- [ ] Definir lista final de produtos permanentes da PattaMansa
- [ ] Limpar duplicatas geradas durante fase de Copa
- [ ] Revisar todos os handles de produto (sem acentos, sem referências a Copa)
- [ ] Revisar todos os vendors (padronizar como "PattaMansa")
- [ ] Revisar todas as tags (remover Copa, futebol, seleção)
- [ ] Revisar descrições de produto (copy alinhado à marca)
- [ ] Subir fotos finais para cada produto
- [ ] Validar variantes (modelo, cor, tamanho) de cada produto

### Coleções

- [ ] Criar coleções reais permanentes (Caramelo, Clube Canino, Seleção Canina etc.)
- [ ] Remover ou renomear coleções com referência a Copa
- [ ] Definir imagem de coleção para cada coleção
- [ ] Ordenar produtos dentro das coleções

### Estoque e Integração

- [ ] Revisar estoque de cada SKU
- [ ] Validar integração com Reserva INK (fulfillment)
- [ ] Confirmar que variantes esgotadas sinalizam corretamente
- [ ] Testar fluxo completo: pedido > confirmação > Reserva INK > envio

### Outras

- [ ] Revisar política de frete real
- [ ] Configurar zonas de envio
- [ ] Ativar Pix como forma de pagamento (se não estiver ativo)

---

## Observação sobre Reserva INK

A integração com Reserva INK é o fulfillment de produção e envio das camisetas. Qualquer alteração que afete SKUs, variantes ou fluxo de pedidos pode impactar essa integração.

**Não alterar nada relacionado à integração Reserva INK sem validação técnica.**

A validação deve incluir:
1. Confirmar que o SKU do produto bate com o SKU esperado pela Reserva INK
2. Testar pedido de teste em staging antes de alterar em produção
3. Confirmar recebimento do pedido no painel da Reserva INK
