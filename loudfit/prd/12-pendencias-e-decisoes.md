# 12 — Pendências e decisões

**Última atualização:** 2026-07-11
**Responsável:** Jean Lucca (curadoria) + áreas responsáveis
**Status:** Vivo — atualizar a cada mudança relevante

---

## Resumo

Este documento é o registro central de decisões, dúvidas, dependências e riscos do projeto LoudFit. Deve ser atualizado sempre que um tema evoluir (decisão fechada, pendência resolvida, novo risco identificado).

---

## Decisões confirmadas

| Tema | Decisão | Data | Responsável | Fonte |
| ---- | ------- | ---- | ----------- | ----- |
| Tabela padrão de planos | Power Mensal R$149,90 / Recorrente R$139,90 / Semestral R$129,90 / Anual R$119,90. Primeira mensalidade R$9,90 apenas no Anual Recorrente. | 2026-07-02 | Comercial | `src/lib/plans.ts`. |
| Tabela Ipiranga | Power Mensal R$199,90 / Recorrente R$189,00 / Semestral R$179,90 / Anual R$179,90. R$9,90 no Anual. | 2026-07-02 | Comercial | `src/lib/plans.ts`. |
| Home não polui com todas as unidades | Usar `HomeUnitsGrid` (resumo) + acesso pleno em `/unidades`. | 2026-07-03 | Marca | `docs/PRD_LOUDFIT.md`, `src/app/page.tsx`. |
| Área de planos com fundo claro | Alternar preto/claro para dar respiro. | 2026-07-03 | Marca | `docs/PRD_LOUDFIT.md`, `AUDIT.md`. |
| Cor volt oficial | `--lf-volt: #FFE500`. | 2026-07-03 | Marca | `VISUAL_DIRECTION.md`. |
| Tagline principal | "O melhor ainda está por vir." (Hero + Footer). | 2026-07-02 | Marca | `src/components/sections/Hero.tsx`, `src/components/layout/Footer.tsx`. |
| Ordem de destaque comercial | R$9,90 → aulas coletivas inclusas → acesso livre → convidados até 5 → experimental grátis → reconhecimento facial → checkout online. | 2026-07-03 | Comercial | `docs/PRD_LOUDFIT.md`. |
| WhatsAppFloat separa atendimento e franquia | Painel único, duas seções. | 2026-07-06 | Marca | `src/components/ui/WhatsAppFloat.tsx`. |
| Redirect permanente `/unidades/carreco-curvalinhos` | Aponta para `/unidades/carrefour-valinhos`. | Anterior | Desenvolvimento | `next.config.ts`. |
| Ipiranga status `em_breve` | Página aceita "Garantir matrícula online". | Anterior | Comercial | `src/lib/supabase.ts`, `src/app/unidades/[slug]/page.tsx`. |
| Mogi Mirim status `ativa` | — | Anterior | Comercial | `src/lib/supabase.ts`. |
| Endereços saneados | Endereços das seis unidades padronizados no repositório. | 2026-07-09 | Operação | `docs/google-business-profile/google-business-profile-audit.md`. |

---

## Decisões provisórias

| Tema | Decisão provisória | Motivo | Revisar em |
| ---- | ------------------ | ------ | ---------- |
| Site em `loudfit.vercel.app` | Manter enquanto `loudfit.com.br` não apontar. | DNS pendente. | Quando `loudfit.com.br` estiver ativo. |
| Fotos genéricas nas páginas de unidade | Reutilizar `real-*` como cover até chegarem fotos oficiais. | Materiais oficiais pendentes. | Assim que forem entregues. |
| `hero.mp4` provisório | Manter enquanto vídeo institucional final não estiver pronto. | Produção com André. | Após entrega. |
| Envio de leads de franquia via Supabase | Aceitar como fallback enquanto `FRANCHISE_LEAD_WEBHOOK_URL` não estiver definido. | Falta destino externo. | Quando o time definir provedor final. |
| Uso do WhatsApp da Vila Industrial como canal de expansão | Manter até haver um número dedicado. | Não há número exclusivo. | Se surgir número dedicado. |
| Grade de aulas coletivas vazia em Anchieta SP e Ipiranga | Interface esconde a seção quando não há aulas. | Grade oficial pendente. | Após confirmação com as unidades. |

---

## Dados pendentes

| Item | Onde falta | Ação |
| ---- | ---------- | ---- |
| Google Maps URL das seis unidades | `officialUnitData` / `fallbackUnits`. | Preencher após confirmação GBP. |
| Google Place ID das seis unidades | `officialUnitData` / `fallbackUnits`. | Preencher após confirmação GBP. |
| Instagram por unidade | `officialUnitData` — apenas Vila Industrial cadastrado. | Cadastrar por unidade quando existir perfil. |
| Modalidades oficiais de Anchieta e Ipiranga | `modalidades: []` em `src/lib/supabase.ts`. | Confirmar com operação e cadastrar. |
| Confirmação do WhatsApp da Mogi Mirim | `officialUnitData` — usa `19 99142-9998`. | Validar com a unidade. |
| Fundadores em `/sobre` | Placeholder LF. | Substituir por fotos oficiais. |
| Vídeo institucional final | `public/hero.mp4`. | Substituir com material do André. |
| Política de privacidade real | `src/app/politica-de-privacidade/page.tsx`. | Substituir texto por versão jurídica. |
| Número dedicado para expansão de franquia | Hoje usa Vila Industrial. | A definir. |
| Deep-link EVO para pré-selecionar plano | Não confirmado com W12/EVO. | Contatar W12/EVO. |
| Domínio final (`loudfit.com.br`) | DNS. | Apontar. |
| `FRANCHISE_LEAD_WEBHOOK_URL` em produção | Vercel Env. | Definir se webhook ou Supabase será oficial. |

---

## Dependências externas

| Dependência | O que depende | Impacto se não vier |
| ----------- | ------------- | ------------------- |
| Aceite dos convites de GBP (Amoreiras, Anchieta, Vila Industrial) | Reivindicação dos perfis por unidade. | Perfis podem seguir com dados antigos e ranqueando errado. |
| Validação do GBP Mogi Mirim | Confirmar propriedade da ficha atual. | Sem controle sobre o perfil na busca local. |
| Validação do GBP Ipiranga | Confirmar propriedade. | Idem. |
| Resposta W12/EVO sobre deep-link de plano | Pré-seleção de plano no checkout. | Fluxo continua exigindo escolha de plano dentro do EVO. |
| Advogado / jurídico | Política de privacidade + textos comerciais de franquia. | Publicação continua com placeholder. |
| Contadora / financeiro | Validação dos números comerciais de franquia. | Números seguem como "estimativas" em vez de "confirmados". |
| André | Vídeo institucional oficial. | Segue `hero.mp4` provisório. |
| Registro do domínio `loudfit.com.br` | Apontamento DNS. | URLs canonical seguem em `loudfit.vercel.app`. |
| Gestor de tráfego | Rastreamento e campanhas. | Sem métricas de conversão. |

---

## Riscos

| Risco | Impacto | Mitigação |
| ----- | ------- | --------- |
| Perfis GBP antigos (Pano Bianco) permanecerem ranqueando. | Alto — usuários chegam em nome errado. | Executar auditoria completa; reivindicar e mesclar perfis. |
| Iframe do EVO bloqueado em navegadores mobile. | Alto — impede matrícula. | Manter CTA "Abrir em nova aba" bem visível. |
| Dados divergentes entre site, GBP e WhatsApp. | Médio — quebra confiança. | `officialUnitData` é a fonte de verdade; refletir em GBP. |
| Cliente cadastra na unidade errada (checkout errado). | Alto — atendimento cruzado. | CTA e WhatsAppFloat segmentam por unidade; reforçar com script de recepção. |
| Uso indevido do Day Use (fraude). | Médio — inflação de custo. | Regras claras: um por CPF/WhatsApp, voucher único, validade. |
| Números comerciais de franquia sem validação jurídica. | Alto — risco legal. | Publicar como estimativas + revisar antes de material formal. |
| LGPD sem consentimento explícito. | Alto — risco jurídico. | Implementar banner + revisar textos dos formulários. |
| Falta de rastreamento → decisões no escuro. | Alto — desperdício de mídia. | Implementar GA4/Pixel/CAPI (P1). |
| Vídeo hero pesado em mobile. | Médio — LCP alto. | Otimizar `hero.mp4` ao substituir. |
| Sem redundância dos leads de franquia. | Médio — perda de lead se webhook cair. | Manter Supabase como fallback ativo; monitorar. |

---

## Questões jurídicas ou financeiras

| Tema | Pergunta | Responsável |
| ---- | -------- | ----------- |
| COF (Circular de Oferta de Franquia) | Documento vigente disponível? | Jurídico. |
| Payback / lucratividade estimada | Como suportar 15 meses e 25–35% em material formal? | Financeiro. |
| Royalties 7% e publicidade 2% | Vinculação contratual e periodicidade. | Jurídico. |
| Território exclusivo | Cláusulas de exclusividade por praça. | Jurídico. |
| LGPD | Aceite explícito nos formulários (franquia + Day Use). | Jurídico. |
| Política de privacidade | Texto vigente / adequado à LGPD? | Jurídico. |
| Direitos de imagem | Autorização para uso de imagens de alunos (fotos e vídeos). | Jurídico + Marca. |
| Contratos com W12/EVO | Escopo do checkout, webhook e SLA. | Comercial. |
| CNPJ correto no site | `LOUD FRANQUEADORA LTDA — 45.519.405/0001-79` no footer. Validar razão social atual. | Jurídico. |
| Termos de uso | Não existem no site. É necessário? | Jurídico. |

---

## Histórico de mudanças

Registro cronológico das principais mudanças no ecossistema digital.

| Data | Mudança | Responsável | Impacto |
| ---- | ------- | ----------- | ------- |
| 2026-06-23 | Primeiro preview do site publicado no Vercel (commit `ae7cc02`). | Desenvolvimento | Início da presença digital. |
| 2026-07-02 | Correção R$9,90 no Anual Recorrente, criação da tabela Ipiranga, entrada da Mogi Mirim, redesenho visual (commit `ddfca93`). | Desenvolvimento + Marca | Alinhamento comercial e visual. |
| 2026-07-02 | Site logo oficial, tagline no Footer, subtitle do hero, metadata (commit `6e46c6c`). | Marca + Desenvolvimento | Consolidação da marca. |
| 2026-07-03 | Auditoria visual (`AUDIT.md`) → elevação visual (`CHANGELOG.md`). | Desenvolvimento + Marca | Site menos "template". |
| 2026-07-03 | Direção esportiva/tecnológica (`VISUAL_DIRECTION.md`). | Marca + Desenvolvimento | Identidade LoudFit reforçada. |
| 2026-07-09 | Sanitização de endereços e WhatsApps das seis unidades (`docs/google-business-profile/google-business-profile-audit.md`). | Operação | Base de dados operacionais coerente. |
| 2026-07-11 | Criação do PRD oficial (pasta `prd/`) com 14 documentos. | Jean Lucca | Fonte de verdade centralizada. |

---

## Como manter este documento

- Item se torna decisão confirmada → move para "Decisões confirmadas".
- Item se torna decisão provisória → registra em "Decisões provisórias" com prazo de revisão.
- Item resolvido → move para "Histórico de mudanças" com data e responsável.
- Item novo → cria linha na tabela correta.
- Alterações em `officialUnitData`, planos, checkouts ou CNPJ → **sempre** registrar aqui.

---

## Próximas ações

- Revisar tabelas com o time comercial e sinalizar cada item pendente com responsável nomeado.
- Definir dono de cada tema jurídico/financeiro.
- Estabelecer cadência de reuniões (semanal para P0/P1, quinzenal para P2, mensal para revisão do PRD).
- Após cada release, atualizar o histórico e os `Status` do roadmap (`11-roadmap-e-backlog.md`).
