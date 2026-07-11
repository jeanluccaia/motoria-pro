# 03 — Unidades

**Última atualização:** 2026-07-11
**Responsável:** Time de operações + expansão
**Status:** Parcial — dados a confirmar por unidade

---

## Resumo

Cadastro operacional das seis unidades da LoudFit para uso no site, no atendimento e nas configurações de canais externos (GBP, WhatsApp, checkout EVO). O documento cruza dois níveis de dado:

- **O que está no repositório** — arquivo `src/lib/supabase.ts` (`fallbackUnits` e `officialUnitData`) e `docs/google-business-profile/google-business-profile-audit.md`.
- **O que foi informado comercialmente** e ainda precisa cruzar com o repositório.

Discrepâncias entre as duas fontes viraram itens `DADO A VALIDAR` neste documento.

---

## Tabela-mestre

| Unidade | Cidade/Estado | Status | Endereço | Telefone / WhatsApp | Página | Checkout EVO | Google Business | Pendências principais |
| ------- | ------------- | ------ | -------- | ------------------- | ------ | ------------ | --------------- | --------------------- |
| Carrefour Valinhos | Valinhos, SP | `ativa` | Av. Eng. Antonio Francisco de Paula Souza, 3900, SL 11 — Valinhos, SP | `(19) 99441-0440` — `wa.me/5519994410440` | `/unidades/carrefour-valinhos` | Presente (`loudfit/1/site/...`) | Acesso concedido | Confirmar telefone fixo (se houver), modalidades finais. |
| Amoreiras | Campinas, SP | `ativa` | Av. das Amoreiras, 3771 — Campinas, SP | `(19) 99855-4252` — `wa.me/5519998554252` | `/unidades/amoreiras` | Presente (`loudfit/2/site/...`) | Convite enviado | Confirmar aceite do convite GBP, fotos oficiais. |
| Anchieta SP | São Paulo, SP | `ativa` | Rodovia Anchieta, 1778 — Vila Moinho Velho, São Paulo, SP | `(11) 99298-9496` — `wa.me/5511992989496` | `/unidades/anchieta-sp` | Presente (`loudfit/3/site/...`) | Convite enviado | Confirmar modalidades finais (grade vazia hoje), aceite GBP. |
| Vila Industrial | Campinas, SP | `ativa` | Rua Antonio Bento, 347 — Vila Industrial, Campinas, SP | `(19) 98829-1946` — `wa.me/5519988291946` | `/unidades/vila-industrial` | Presente (`loudfit/4/site/...`) | Convite enviado | Confirmar aceite do convite GBP. |
| Mogi Mirim | Mogi Mirim, SP | `ativa` | Rua Padre Roque, 939 — Mogi Mirim, SP | `(19) 99142-9998` (no `fallbackUnits`) — `wa.me/5519991429998` | `/unidades/mogi-mirim` | Presente (`loudfit/5/site/...`) | Ficha localizada no Maps sem administrador. Solicitação de gerenciamento enviada. | WhatsApp diferente do informado comercialmente (ver alerta abaixo). Validação por telefone da unidade ou vídeo pendente. |
| Ipiranga | São Paulo, SP | `em_breve` | Rua Lino Coutinho, 385 — Ipiranga, São Paulo, SP | `(11) 93733-4895` — `wa.me/5511937334895` | `/unidades/ipiranga` | Presente (`loudfit/6/site/...`) | Perfil localizado no Google, processo a validar | Tabela de preços própria (`getPlans('ipiranga')`); validar dados comerciais diferentes das demais. |

Fonte técnica: `src/lib/supabase.ts` (`fallbackUnits`, `officialUnitData`).
Fonte comercial: instruções recebidas pelo time em 2026-07-09 (`docs/google-business-profile/google-business-profile-audit.md`).

---

## Fichas por unidade

### 1. LoudFit Carrefour Valinhos

- **Slug:** `carrefour-valinhos`
- **Cidade/Estado:** Valinhos, SP
- **Bairro:** Carrefour Valinhos
- **Status:** `ativa`
- **Ano de abertura (repositório):** 2024
- **Endereço:** Av. Eng. Antonio Francisco de Paula Souza, 3900, SL 11 — Valinhos, SP
- **Coordenadas:** `-22.9707, -46.9958`
- **WhatsApp:** `+55 19 99441-0440` — link `https://wa.me/5519994410440`
- **Telefone fixo:** `NÃO LOCALIZADO NO REPOSITÓRIO`
- **Horários:**
  - Segunda a quinta: 06h às 23h
  - Sexta: 06h às 22h
  - Sábado, domingo e feriados: 08h às 18h
- **Página no site:** `/unidades/carrefour-valinhos`
- **Redirect legado:** `/unidades/carreco-curvalinhos` → `/unidades/carrefour-valinhos` (permanente).
- **Checkout EVO:** `https://evo-totem.w12app.com.br/loudfit/1/site/%5BPLUS%5DeIL%5BPLUS%5DfzZNcy7Gt%5BBAR%5DPl5KIrQ%5BEQUAL%5D%5BEQUAL%5D`
- **Google Business Profile:** acesso já concedido à conta de gestão.
- **Modalidades cadastradas:** Step, Crosstreino, FitDance, Jump, Muay Thai, Zumba, Loud Dance, GAP, Pilates, Pump, Alongamento.
- **Pendências:** telefone fixo, `google_maps_url`, `google_place_id`, fotos oficiais.

### 2. LoudFit Amoreiras

- **Slug:** `amoreiras`
- **Cidade/Estado:** Campinas, SP
- **Bairro:** Amoreiras
- **Status:** `ativa`
- **Ano de abertura (repositório):** 2024
- **Endereço:** Av. das Amoreiras, 3771 — Campinas, SP
- **Coordenadas:** `-22.9329, -47.0738`
- **WhatsApp:** `+55 19 99855-4252` — link `https://wa.me/5519998554252`
- **Horários:**
  - Segunda a quinta: 05h às 23h
  - Sexta: 05h às 22h
  - Sábado: 08h às 18h
  - Domingo e feriados: 08h às 14h
- **Página no site:** `/unidades/amoreiras`
- **Checkout EVO:** `https://evo-totem.w12app.com.br/loudfit/2/site/uRcgN1BLXvcYzmC%5BBAR%5DZHe3rg%5BEQUAL%5D%5BEQUAL%5D`
- **Google Business Profile:** convite enviado; aguardando aceite.
- **Modalidades cadastradas:** Spinning, Pump, Pilates, FitDance, Ritbox, Alongamento, GAP, Muay Thai, Jump.
- **Pendências:** aceite do GBP, `google_maps_url`, fotos oficiais, Instagram próprio.

### 3. LoudFit Anchieta SP

- **Slug:** `anchieta-sp`
- **Cidade/Estado:** São Paulo, SP
- **Bairro:** Vila Moinho Velho
- **Status:** `ativa`
- **Ano de abertura (repositório):** 2024
- **Endereço:** Rodovia Anchieta, 1778 — Vila Moinho Velho, São Paulo, SP
- **Coordenadas:** `-23.6289, -46.5948`
- **WhatsApp:** `+55 11 99298-9496` — link `https://wa.me/5511992989496`
- **Horários:**
  - Segunda a quinta: 05h às 23h
  - Sexta: 05h às 22h
  - Sábado, domingo e feriados: 08h às 18h
- **Página no site:** `/unidades/anchieta-sp`
- **Checkout EVO:** `https://evo-totem.w12app.com.br/loudfit/3/site/h%5BBAR%5DKEL8uI95qdrw2eJYudZQ%5BEQUAL%5D%5BEQUAL%5D`
- **Google Business Profile:** convite enviado; aguardando aceite.
- **Modalidades cadastradas:** `NÃO LOCALIZADO NO REPOSITÓRIO` (`modalidades: []`). Ver `PENDENCIAS.md`.
- **Pendências:** grade oficial de aulas coletivas, aceite GBP, fotos, Instagram próprio.

### 4. LoudFit Vila Industrial

- **Slug:** `vila-industrial`
- **Cidade/Estado:** Campinas, SP
- **Bairro:** Vila Industrial
- **Status:** `ativa`
- **Ano de abertura (repositório):** 2024
- **Endereço:** Rua Antonio Bento, 347 — Vila Industrial, Campinas, SP
- **Coordenadas:** `-22.9099, -47.0608`
- **WhatsApp:** `+55 19 98829-1946` — link `https://wa.me/5519988291946`
  - Este WhatsApp é também usado como **canal oficial de expansão / franquia** no site (Footer e formulário de franquia).
- **Horários:**
  - Segunda a quinta: 05h às 23h
  - Sexta: 05h às 22h
  - Sábado: 08h às 20h
  - Domingo e feriados: 08h às 14h
- **Página no site:** `/unidades/vila-industrial`
- **Checkout EVO:** `https://evo-totem.w12app.com.br/loudfit/4/site/7rlDfyRNEkamlvXH5WMvow%5BEQUAL%5D%5BEQUAL%5D`
- **Google Business Profile:** convite enviado; aguardando aceite.
- **Instagram próprio:** `https://www.instagram.com/loudfit.vilaindustrial/`.
- **Modalidades cadastradas:** FitDance, Funcional, GAP, Spinning, Pilates, Yoga, Jiu-Jitsu.
- **Pendências:** aceite GBP, fotos oficiais.

### 5. LoudFit Mogi Mirim

- **Slug:** `mogi-mirim`
- **Cidade/Estado:** Mogi Mirim, SP
- **Bairro:** Centro
- **Status:** `ativa`
- **Ano de abertura (repositório):** 2024
- **Endereço:** Rua Padre Roque, 939 — Mogi Mirim, SP (informação comercial informou "Rua Padre Roque" — número **939** vem do repositório).
- **Coordenadas:** `-22.4321, -46.9582`
- **WhatsApp (repositório):** `+55 19 99142-9998` — link `https://wa.me/5519991429998`.

> ⚠️ **DADO A VALIDAR:** o time comercial não repassou WhatsApp específico para Mogi Mirim; o repositório utiliza `19 99142-9998`. **Confirmar** com a unidade se este é o número operacional em uso, para atendimento e para o painel do WhatsAppFloat.

- **Horários:**
  - Segunda a quinta: 05h às 23h
  - Sexta: 05h às 22h
  - Sábado: 08h às 18h
  - Domingo: 08h às 16h
  - Feriados: 08h às 14h
- **Página no site:** `/unidades/mogi-mirim`
- **Checkout EVO:** `https://evo-totem.w12app.com.br/loudfit/5/site/QhXXzoY7OMy%5BPLUS%5DFpULG15Wrw%5BEQUAL%5D%5BEQUAL%5D`
- **Google Business Profile:** ficha localizada no Google Maps sem administrador. Solicitação de gerenciamento enviada. **Validação possível por telefone da unidade ou vídeo da empresa** — pendente.
- **Modalidades cadastradas:** Pilates Solo, FitDance, Muay Thai, Spinning, Ritbox, Jump, Funcional, Alongamento/Mobilidade.
- **Pendências:** validação do WhatsApp, conclusão do processo GBP, fotos oficiais.

### 6. LoudFit Ipiranga

- **Slug:** `ipiranga`
- **Cidade/Estado:** São Paulo, SP
- **Bairro:** Ipiranga
- **Status:** `em_breve` (unidade em implantação/inauguração)
- **Ano de abertura (repositório):** 2025
- **Endereço:** Rua Lino Coutinho, 385 — Ipiranga, São Paulo, SP
- **Coordenadas:** `-23.5898, -46.6093`
- **WhatsApp:** `+55 11 93733-4895` — link `https://wa.me/5511937334895`
- **Horários:**
  - Segunda a quinta: 05h às 23h
  - Sexta: 05h às 22h
  - Sábado: 08h às 15h
  - Domingo e feriados: 08h às 14h
- **Página no site:** `/unidades/ipiranga`
- **Checkout EVO:** `https://evo-totem.w12app.com.br/loudfit/6/site/0GaE9Ux52vXSBHXLH2E5hg%5BEQUAL%5D%5BEQUAL%5D`
- **Google Business Profile:** perfil localizado na busca. Processo a validar (proprietário atual, categoria correta).
- **Modalidades cadastradas:** `NÃO LOCALIZADO NO REPOSITÓRIO` (`modalidades: []`). Ver `PENDENCIAS.md`.
- **Particularidade comercial:** tabela de preços própria (ver `04-planos-e-conversao.md`).
- **Pendências:** modalidades finais, dados comerciais diferentes das demais unidades, cronograma de inauguração.

---

## Cruzamento com o WhatsAppFloat

O painel flutuante (`src/components/ui/WhatsAppFloat.tsx`) mostra as seis unidades com os seguintes WhatsApps:

- Carrefour Valinhos → `wa.me/5519994410440`
- Vila Industrial → `wa.me/5519988291946`
- Amoreiras → `wa.me/5519998554252`
- Anchieta SP → `wa.me/5511992989496`
- Mogi Mirim → `wa.me/5519991429998`
- Ipiranga → `wa.me/5511937334895`

Todos os seis batem com o `officialUnitData` e o `fallbackUnits`. Se algum WhatsApp for atualizado, **atualizar os três lugares**: `officialUnitData`, `fallbackUnits` (se aplicável) e `WhatsAppFloat`.

---

## Modalidades por unidade (referência)

Uma unidade só exibe chips de modalidade se `unit.modalidades` tiver itens. A grade final aparece na página da unidade se pelo menos uma modalidade cair no allowlist `AULAS_COLETIVAS` em `src/app/unidades/[slug]/page.tsx` (Muay Thai, Pilates, Pilates Solo, FitDance, Fit Dance, Zumba, Jump, Spinning, Yoga, Jiu-Jitsu, Pump, GAP, Step, Crosstreino, Loud Dance, Alongamento, Alongamento/Mobilidade, Funcional, Ritbox).

Unidades com modalidades vazias hoje: **Anchieta SP** e **Ipiranga**. A interface esconde a grade quando não há aulas (`hasAulas === false`).

---

## Redirects legados

`next.config.ts`:

- `/unidades/carreco-curvalinhos` → `/unidades/carrefour-valinhos` (permanente).

Se surgirem outros slugs históricos (Pano Bianco, `/unidades/anchieta`, `/unidades/valinhos`, `/unidades/campinas`) que estejam ranqueando no Google, avaliar novos redirects.

---

## Sinalização de status

`UnitStatus` (`src/types/index.ts`):

- `ativa` — operação normal.
- `em_breve` — pré-inauguração; página aceita "Garantir matrícula online" quando há checkout.
- `em_obras` — planejado; nenhuma unidade usa este estado hoje.

---

## Próximas ações

- Confirmar WhatsApp da unidade Mogi Mirim com a operação.
- Substituir foto de capa das unidades por material oficial (`PENDENCIAS.md`).
- Preencher grade oficial de aulas coletivas de Anchieta SP e Ipiranga.
- Preencher `google_maps_url` e `google_place_id` de cada unidade após conclusão do processo GBP.
- Confirmar Instagram próprio das unidades além de Vila Industrial.
- Fechar cronograma de inauguração da Ipiranga e refletir no `status` quando aplicável.
