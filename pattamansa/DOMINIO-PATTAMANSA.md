# Migração de Domínio — PattaMansa

## Domínios configurados na Vercel

| Domínio               | Função                           |
|-----------------------|----------------------------------|
| `pattamansa.com.br`   | Domínio principal (canonical)    |
| `www.pattamansa.com.br` | Redireciona para o principal   |

Os dois domínios já foram adicionados ao projeto na Vercel.
O `vercel.json` já inclui redirect permanente (301) de `www` → raiz.

---

## Registros DNS necessários

Configure no painel do seu provedor DNS (ex: Registro.br, Nuvemshop, Cloudflare):

### Domínio raiz — `pattamansa.com.br`

| Tipo | Nome | Valor         | TTL  |
|------|------|---------------|------|
| `A`  | `@`  | `76.76.21.21` | Auto |

### Subdomínio www — `www.pattamansa.com.br`

| Tipo    | Nome  | Valor                  | TTL  |
|---------|-------|------------------------|------|
| `CNAME` | `www` | `cname.vercel-dns.com` | Auto |

> **Atenção:** Esses são os valores padrão da Vercel para DNS externo.
> Confirme no painel em: vercel.com → projeto pattamansa → Settings → Domains

---

## Passo a passo para alterar no Registro.br

1. Acesse **registro.br** e faça login
2. Vá em **Meus Domínios** → `pattamansa.com.br` → **DNS**
3. Se estiver usando os nameservers da Nuvemshop, você tem duas opções:
   - **Opção A (recomendada):** Alterar os nameservers para os da Vercel ou deixar no Registro.br e criar os registros A e CNAME diretamente
   - **Opção B:** Ir ao painel da Nuvemshop → DNS → adicionar os mesmos registros lá
4. Adicione o registro `A` apontando `@` para `76.76.21.21`
5. Adicione o registro `CNAME` apontando `www` para `cname.vercel-dns.com`
6. Salve e aguarde propagação (geralmente 5 min a 48h)

---

## ⚠️ ALERTA IMPORTANTE — NÃO cancele a Nuvemshop antes de validar

**Não remova o domínio da Nuvemshop e não cancele o plano antes de:**
- Confirmar que `pattamansa.com.br` abre a landing page da Vercel
- Confirmar que o HTTPS está ativo (cadeado verde no browser)
- Testar no celular fora do Wi-Fi da sua casa

A propagação de DNS pode levar até 48h.
Durante esse período, parte dos usuários ainda pode acessar a Nuvemshop e outra parte já acessa a Vercel — isso é normal.

---

## Checklist de validação pós-migração

- [ ] `pattamansa.com.br` abre a landing page correta
- [ ] `www.pattamansa.com.br` redireciona para `pattamansa.com.br`
- [ ] HTTPS ativo (cadeado verde, sem aviso de segurança)
- [ ] Imagens carregando normalmente
- [ ] Seção Seleção Canina funcionando (swatches de cor, tamanhos)
- [ ] Seção Clube Canino funcionando (swatches de cor, tamanhos)
- [ ] Botão "Pedir via WhatsApp" abrindo corretamente
- [ ] Guia de medidas abrindo (modal/bottom-sheet)
- [ ] Versão mobile ok (testar no celular com 4G/5G, não só Wi-Fi)
- [ ] Seção Algodão Peruano visível
- [ ] Navegação do menu funcionando
- [ ] Scroll da página fluido

---

## Status atual do projeto

- Deploy ativo em: `https://pattamansa.vercel.app`
- Domínios adicionados na Vercel: `pattamansa.com.br` e `www.pattamansa.com.br`
- Todos os paths do projeto são relativos — compatível com qualquer domínio
- Canonical URL configurada para `https://pattamansa.com.br`
- Redirect www → raiz configurado no `vercel.json`
