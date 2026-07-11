# 07 — Google Business Profile

**Última atualização:** 2026-07-11
**Responsável:** Time de marketing LoudFit + operação das unidades
**Status:** Em execução — perfis em processo de padronização

---

## Resumo

Este documento consolida o processo de organização dos perfis do Google Business Profile (GBP) das seis unidades da LoudFit. O objetivo é **centralizar todos os perfis em uma conta de gestão oficial da LoudFit**, com dados padronizados, e eliminar dependências de administradores antigos ou do nome do negócio anterior (Pano Bianco).

Fontes usadas:

- `docs/google-business-profile/google-business-profile-audit.md` (auditoria completa).
- `docs/google-business-profile/google-business-profile-audit.csv` (dados tabulares).
- `docs/google-business-profile/supabase-unit-data-sync.md` (regras de sincronização de dados).
- `src/lib/supabase.ts` (dados oficiais atuais).

---

## Objetivo

Cada uma das seis unidades LoudFit deve ter no Google Maps e Google Search um perfil GBP com:

- **Nome:** `LoudFit [Nome da Unidade]` — nunca "Pano Bianco" ou variações.
- **Categoria principal:** Academia de ginástica.
- **Categorias secundárias:** Musculação, Pilates, Artes marciais (conforme modalidades da unidade).
- **Endereço** conforme campo `endereco_completo` do repositório.
- **Telefone / WhatsApp** conforme cadastro operacional.
- **Horários** conforme unidade.
- **Site** apontando para `https://loudfit.com.br/unidades/[slug]` (ou o domínio final aprovado).
- **Fotos oficiais** — fachada, área de musculação, cardio, aulas coletivas.

> Unidades LoudFit foram instaladas em locais onde funcionavam lojas **Pano Bianco**. Existe risco elevado de perfis antigos ainda estarem no nome da marca anterior. Cada unidade precisa ser auditada.

---

## Status atual por unidade

| Unidade | Cidade / Estado | Status do site | Status GBP | Ação atual |
| ------- | --------------- | -------------- | ---------- | ---------- |
| Carrefour Valinhos | Valinhos, SP | Ativa | **Acesso concedido** à conta de gestão. | Completar dados (fotos, categorias, site). |
| Amoreiras | Campinas, SP | Ativa | Convite enviado. | Aguardando aceite. |
| Anchieta SP | São Paulo, SP | Ativa | Convite enviado. | Aguardando aceite. |
| Vila Industrial | Campinas, SP | Ativa | Convite enviado. | Aguardando aceite. |
| Mogi Mirim | Mogi Mirim, SP | Ativa | Ficha localizada no Maps **sem administrador**. Solicitação de gerenciamento enviada. | Aguardar validação (telefone da unidade ou vídeo da empresa). |
| Ipiranga | São Paulo, SP | `em_breve` | Perfil localizado na busca do Google. Processo a validar. | Confirmar propriedade / criar perfil se necessário. |

---

## Ficha detalhada por unidade

Cada ficha reúne os dados a serem preenchidos no perfil GBP. Os endereços, WhatsApps e horários foram saneados em 2026-07-09 e refletem `officialUnitData` em `src/lib/supabase.ts`. Google Maps URL e Place ID **ainda não localizados no repositório** para nenhuma unidade.

### Carrefour Valinhos
- **Nome:** LoudFit Carrefour Valinhos.
- **Endereço:** Av. Eng. Antonio Francisco de Paula Souza, 3900, SL 11 — Valinhos, SP.
- **Telefone:** (19) 99441-0440.
- **Horários:** Seg–Qui 06h–23h · Sex 06h–22h · Sáb/Dom/Feriados 08h–18h.
- **Site:** `/unidades/carrefour-valinhos`.
- **Instagram:** `NÃO LOCALIZADO NO REPOSITÓRIO`.
- **Proprietário atual do GBP:** LoudFit (acesso concedido).
- **Pendências:** fotos oficiais, `google_place_id`, `google_maps_url` no `Supabase`.

### Amoreiras
- **Nome:** LoudFit Amoreiras.
- **Endereço:** Av. das Amoreiras, 3771 — Campinas, SP.
- **Telefone:** (19) 99855-4252.
- **Horários:** Seg–Qui 05h–23h · Sex 05h–22h · Sáb 08h–18h · Dom/Feriados 08h–14h.
- **Site:** `/unidades/amoreiras`.
- **Proprietário atual:** aguardando aceite do convite.

### Anchieta SP
- **Nome:** LoudFit Anchieta SP.
- **Endereço:** Rodovia Anchieta, 1778 — Vila Moinho Velho, São Paulo, SP.
- **Telefone:** (11) 99298-9496.
- **Horários:** Seg–Qui 05h–23h · Sex 05h–22h · Sáb/Dom/Feriados 08h–18h.
- **Site:** `/unidades/anchieta-sp`.
- **Proprietário atual:** aguardando aceite.

### Vila Industrial
- **Nome:** LoudFit Vila Industrial.
- **Endereço:** Rua Antonio Bento, 347 — Vila Industrial, Campinas, SP.
- **Telefone:** (19) 98829-1946 (mesmo número é usado como WhatsApp de expansão).
- **Horários:** Seg–Qui 05h–23h · Sex 05h–22h · Sáb 08h–20h · Dom/Feriados 08h–14h.
- **Site:** `/unidades/vila-industrial`.
- **Instagram:** `https://www.instagram.com/loudfit.vilaindustrial/`.
- **Proprietário atual:** aguardando aceite.

### Mogi Mirim
- **Nome:** LoudFit Mogi Mirim.
- **Endereço:** Rua Padre Roque, 939 — Mogi Mirim, SP.
- **Telefone (repositório):** (19) 99142-9998. **DADO A VALIDAR** (ver `03-unidades.md`).
- **Horários:** Seg–Qui 05h–23h · Sex 05h–22h · Sáb 08h–18h · Dom 08h–16h · Feriados 08h–14h.
- **Site:** `/unidades/mogi-mirim`.
- **Proprietário atual:** perfil no Google **sem administrador**. Solicitação de gerenciamento enviada. Validação possível por telefone ou vídeo.

### Ipiranga
- **Nome:** LoudFit Ipiranga.
- **Endereço:** Rua Lino Coutinho, 385 — Ipiranga, São Paulo, SP.
- **Telefone:** (11) 93733-4895.
- **Horários:** Seg–Qui 05h–23h · Sex 05h–22h · Sáb 08h–15h · Dom/Feriados 08h–14h.
- **Site:** `/unidades/ipiranga`.
- **Status:** unidade em inauguração.
- **Proprietário atual:** perfil localizado no Google, processo a validar.

---

## Checklist de pesquisa manual no Google Maps

Para cada unidade (`docs/google-business-profile/google-business-profile-audit.md`):

- [ ] Pesquisar "LoudFit [nome da unidade]" no Google Maps.
- [ ] Pesquisar "academia [endereço]" no Google Maps.
- [ ] Pesquisar "Pano Bianco [cidade/bairro]" para identificar perfis do antecessor.
- [ ] Verificar se há perfil duplicado.
- [ ] Anotar o nome exato que aparece no perfil encontrado.
- [ ] Copiar o link do perfil (`https://maps.google.com/maps?cid=...`).
- [ ] Verificar se a conta Google da LoudFit já tem acesso de proprietário.
- [ ] Registrar o status conforme critérios abaixo.

---

## Critérios de status

| Status | Descrição |
| ------ | --------- |
| **OK** | Aparece corretamente como "LoudFit [nome]" com dados atualizados. |
| **ERRADO** | Aparece como "Pano Bianco" ou outro nome incorreto no mesmo endereço. |
| **DUPLICADO** | Existe perfil LoudFit **e** perfil Pano Bianco (ou outro) no mesmo endereço. |
| **NÃO ENCONTRADO** | Nenhum perfil encontrado para o endereço/localização. |
| **SEM ACESSO** | Perfil existe com nome correto, mas ninguém da LoudFit tem acesso de proprietário. |

## Ação recomendada por status

| Status | Ação |
| ------ | ---- |
| **OK** | Revisar e completar dados (horários, telefone, site, fotos). |
| **ERRADO** | Reivindicar perfil e solicitar edição do nome, categoria e dados. |
| **DUPLICADO** | Reivindicar o perfil LoudFit + solicitar mesclagem/remoção do perfil antigo via "Sugerir uma edição". |
| **NÃO ENCONTRADO** | Criar novo perfil via `business.google.com`. |
| **SEM ACESSO** | Usar "Solicitar acesso" no GBP. |

---

## Checklist padrão para novas unidades

Sempre que uma unidade nova entrar em operação (ex.: uma nova franquia), executar:

1. **Criar / reivindicar perfil** no `business.google.com`.
2. **Definir nome oficial** — `LoudFit [Nome da Unidade]`.
3. **Definir categoria principal** — Academia de ginástica.
4. **Definir categorias secundárias** conforme modalidades da unidade.
5. **Preencher endereço** exatamente como no `src/lib/supabase.ts` (ou versão auditada).
6. **Adicionar telefone e WhatsApp** — usar o número operacional da unidade.
7. **Adicionar horários** — refletindo `horarios` cadastrados no repositório.
8. **Apontar site** para `/unidades/[slug]`.
9. **Ativar chat / mensagens** — encaminhar para o WhatsApp da unidade se possível.
10. **Adicionar fotos oficiais** (fachada, musculação, cardio, aulas coletivas) — ver `09-conteudo-e-materiais.md`.
11. **Ativar avaliações** e configurar aviso interno para respostas.
12. **Definir conta de gestão** — nunca deixar apenas conta pessoal.
13. **Atualizar `officialUnitData`** com `google_place_id` e `google_maps_url` para refletir no site.

---

## Dados para preencher no GBP (referência)

| Campo GBP | Fonte no repositório |
| --------- | -------------------- |
| Nome do negócio | Nome oficial `LoudFit [Nome da Unidade]`. |
| Categoria principal | Academia de ginástica. |
| Categorias secundárias | Modalidades da unidade (`unit.modalidades`) — Musculação, Pilates, Artes marciais, Dança fitness. |
| Endereço | `unit.endereco_completo`. |
| Telefone | WhatsApp da unidade (ou telefone fixo, quando houver). |
| Site | `https://loudfit.com.br/unidades/[slug]`. |
| Horários | `unit.horarios`. |
| Fotos | Materiais oficiais recebidos. Ver `09-conteudo-e-materiais.md`. |

---

## Sanitização feita em 2026-07-09

Ver `docs/google-business-profile/google-business-profile-audit.md`, seção "Dados saneados antes da auditoria manual":

- Endereços das seis unidades padronizados.
- WhatsApp da Ipiranga cadastrado.
- Endereços do Anchieta e Amoreiras corrigidos.
- Endereço da Vila Industrial e Mogi Mirim com rua completa.

Não foram alterados componentes visuais ou páginas do site nesta sanitização.

---

## Riscos

- **Perfil antigo Pano Bianco continuar ranqueando** — usuários chegam num nome errado.
- **Perda de avaliações históricas** — mesclar perfis exige cuidado; se o Google recusar, é necessário registrar as avaliações antigas em documento próprio.
- **Divergência de horário entre GBP e site** — se o horário mudar em um lugar mas não no outro, causa frustração no cliente. Fonte de verdade: `officialUnitData` no repositório.
- **Categoria errada** — reduz aparição em buscas por "academia".
- **Fotos genéricas / de banco** — reduzem credibilidade.

---

## Registro final da auditoria

A auditoria completa (`docs/google-business-profile/google-business-profile-audit.md`) prevê um preenchimento manual da tabela:

| Unidade | Nome encontrado no Google | Link do perfil | Status | Ação |
| ------- | ------------------------- | -------------- | ------ | ---- |
| Carrefour Valinhos | — | — | — | — |
| Ipiranga | — | — | — | — |
| Anchieta SP | — | — | — | — |
| Amoreiras | — | — | — | — |
| Vila Industrial | — | — | — | — |
| Mogi Mirim | — | — | — | — |

Este registro deve ser atualizado no arquivo original conforme cada verificação é concluída.

---

## Próximas ações

- Aceitar convites enviados (Amoreiras, Anchieta, Vila Industrial).
- Concluir validação de propriedade da Mogi Mirim (telefone/vídeo).
- Confirmar propriedade da Ipiranga.
- Preencher fotos oficiais em todos os perfis.
- Refletir `google_maps_url` e `google_place_id` no `officialUnitData` para exibição no site.
- Definir responsável interno pela gestão contínua dos perfis (respostas a avaliações, publicações semanais).
