# PRD LoudFit — Índice geral

**Última atualização:** 2026-07-11
**Responsável:** Jean Lucca (validação com o time LoudFit em cada área)
**Status geral:** Documentação inicial consolidada. Aguardando validações comerciais, jurídicas e de imagem por unidade.

---

## Para que serve este PRD

O PRD (Product Requirements Document) da LoudFit é a **fonte de verdade** da operação digital da rede.

Ele reúne, em documentos separados por assunto, tudo o que a LoudFit precisa preservar, decidir e evoluir no ambiente digital: identidade da marca, arquitetura do site, dados das unidades, tabela de planos, expansão por franquia, campanhas ativas, presença no Google Business, marketing e rastreamento, materiais de conteúdo, requisitos técnicos, roadmap e pendências.

Este PRD **não é** um documento de marketing genérico. Ele descreve, com precisão, o que está no repositório atual, o que já foi decidido pela marca e o que ainda precisa ser confirmado, para que qualquer alteração feita por desenvolvedores, designers, gestores de tráfego, atendimento ou novos colaboradores parta da mesma base.

---

## Quem deve consultar

- **Desenvolvimento:** antes de tocar em rotas, componentes, integrações, checkout ou banco de dados.
- **Design / conteúdo:** antes de propor ajustes visuais, redações ou fotos.
- **Gestão de tráfego / marketing:** para configuração de pixels, eventos, UTMs e páginas de campanha.
- **Atendimento e recepção das unidades:** para saber quais canais usar (WhatsApp, e-mail, checkout) e quais dados manter consistentes.
- **Franquias / expansão:** para condições comerciais, funil de captação, materiais.
- **Novos colaboradores:** como leitura inicial para entender o momento do projeto.

---

## Como usar

- Cada documento tem um **objetivo único**. Não misturar assuntos entre documentos.
- Cada documento termina com uma seção **`Próximas ações`**. Elas são o backlog vivo daquele domínio.
- Quando um dado for encontrado no código, ele é registrado com a referência (arquivo).
- Quando um dado **não** for encontrado ou estiver ambíguo, ele é marcado como:
  - `PENDENTE DE CONFIRMAÇÃO` — a marca precisa confirmar.
  - `NÃO LOCALIZADO NO REPOSITÓRIO` — não foi encontrado no código atual.
  - `DADO A VALIDAR` — existe mas precisa de checagem antes de publicar.

---

## Regra de ouro

**Não registrar informação presumida como informação confirmada.**

Se um dado não foi encontrado, ele é registrado como pendência. Se uma decisão ainda é provisória, ela é registrada como decisão provisória. A força deste PRD depende dessa disciplina.

---

## Índice dos documentos

| Documento | Finalidade | Status |
| --------- | ---------- | ------ |
| [00-visao-geral.md](./00-visao-geral.md) | Resumo executivo, objetivos digitais, jornadas de cliente e franqueado. | Consolidado |
| [01-marca-e-posicionamento.md](./01-marca-e-posicionamento.md) | História, propósito, posicionamento, tom de voz e diretrizes de comunicação. | Consolidado |
| [02-arquitetura-do-site.md](./02-arquitetura-do-site.md) | Mapa de rotas, páginas, componentes, CTAs, integrações e decisões de layout. | Consolidado |
| [03-unidades.md](./03-unidades.md) | Cadastro operacional das seis unidades: endereço, WhatsApp, horários, checkout, GBP. | Parcial — dados a confirmar por unidade |
| [04-planos-e-conversao.md](./04-planos-e-conversao.md) | Tabela de planos, checkouts EVO, fluxo de matrícula, mensagens comerciais. | Consolidado |
| [05-franquias.md](./05-franquias.md) | Página de franquias, funil, condições comerciais, Aceleração LoudFit. | Parcial — dados comerciais em validação |
| [06-campanha-day-use.md](./06-campanha-day-use.md) | PRD completo da campanha de Day Use (planejamento, ainda não implementada). | Planejamento |
| [07-google-business-profile.md](./07-google-business-profile.md) | Organização dos perfis GBP das seis unidades. | Em execução |
| [08-marketing-e-rastreamento.md](./08-marketing-e-rastreamento.md) | Meta, Google, Pixel, GA4, GTM, eventos, matriz de rastreamento. | Planejamento — infra não confirmada |
| [09-conteudo-e-materiais.md](./09-conteudo-e-materiais.md) | Materiais necessários por unidade e institucionais. | Parcial — materiais pendentes |
| [10-requisitos-tecnicos.md](./10-requisitos-tecnicos.md) | Framework, deploy, variáveis, SEO, segurança, breakpoints. | Consolidado |
| [11-roadmap-e-backlog.md](./11-roadmap-e-backlog.md) | Roadmap por prioridade (P0–P3). | Consolidado |
| [12-pendencias-e-decisoes.md](./12-pendencias-e-decisoes.md) | Registro central de decisões, pendências, riscos e histórico. | Vivo |

---

## Como atualizar

1. **Nunca alterar dados críticos (preços, checkouts, WhatsApps, CNPJ)** sem cruzar com quem opera a unidade.
2. Alterou algo do produto? Atualize também o documento correspondente.
3. Fechou uma pendência? Mova o item para `Decisões confirmadas` no `12-pendencias-e-decisoes.md` com data e responsável.
4. Um novo documento só entra neste índice se representar um domínio próprio. Assuntos pequenos viram seção dentro de um documento existente.
5. Cada alteração relevante deve ficar registrada no `Histórico de mudanças` em `12-pendencias-e-decisoes.md`.

---

## Data da última auditoria

**2026-07-11** — auditoria completa do repositório para consolidação inicial do PRD.

- Repositório auditado: `C:\Users\DELL\Desktop\jean IA\loudfit`
- Branch analisada: `HEAD` (produção Vercel `loudfit.vercel.app`)
- Fontes utilizadas: código-fonte (`src/`), documentos legados (`docs/`, `AUDIT.md`, `CHANGELOG.md`, `VISUAL_DIRECTION.md`, `PENDENCIAS.md`, `README.md`), memória do projeto.

---

## Próximas ações

- Validar cada documento com a área responsável (comercial, marketing, franquias).
- Fechar as pendências listadas em `12-pendencias-e-decisoes.md`.
- Reauditar este PRD a cada mudança comercial, expansão de unidade ou virada de campanha.
