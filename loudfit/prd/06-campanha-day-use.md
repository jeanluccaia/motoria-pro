# 06 — Campanha Day Use

**Última atualização:** 2026-07-11
**Responsável:** Marketing + Operação das unidades
**Status:** Planejamento — campanha ainda **não** implementada no site

---

## Aviso importante

Este documento descreve o planejamento da campanha de Day Use da LoudFit. **Nada aqui está implementado no repositório.** A landing unificada, o formulário e o voucher são planos e devem ser executados após aprovação — não fazem parte da tarefa atual de documentação.

---

## Conceito

A campanha de Day Use é uma **campanha unificada da rede LoudFit**. Todas as seis unidades participam simultaneamente e o visitante escolhe onde deseja usar seu Day Use.

A campanha combina três objetivos:

1. **Aquisição** — gerar leads qualificados (nome, WhatsApp, unidade).
2. **Presença física** — levar as pessoas até a unidade.
3. **Conversão em matrícula** — converter a visita em cliente após a experiência.

---

## Fluxo alvo

```
Anúncio (Meta / Google / Instagram)
  ↓
CTA "Retire seu Day Use"
  ↓
Landing page unificada (/day-use)
  ↓
Escolha da unidade
  ↓
Cadastro (nome, WhatsApp, e-mail, unidade)
  ↓
Voucher gerado (ou confirmação)
  ↓
Mensagem automática no WhatsApp da unidade
  ↓
Entrada liberada na unidade escolhida
  ↓
Visita presencial (treino / avaliação / aula coletiva)
  ↓
Oferta de matrícula ao final da experiência
```

---

## O que o Day Use pode incluir

- Treino livre de musculação.
- Avaliação física de recepção.
- Uma aula coletiva compatível com a grade da unidade.
- Tour pela estrutura da unidade.
- Atendimento comercial.

A LoudFit **não** deve prometer serviços que dependem de agenda profissional se não conseguir garantir capacidade (ex.: avaliação com personal individual). Ver `Riscos`.

---

## Objetivos

- Gerar leads qualificados.
- Levar pessoas até as unidades.
- Gerar experiência presencial.
- Aumentar matrículas.
- Fortalecer a marca.
- Utilizar uma campanha replicável para toda a rede — mesmo criativo e landing, unidade variável.

---

## Público-alvo

- Moradores próximos às unidades LoudFit.
- Pessoas em período de decisão de compra (comparando academias).
- Ex-alunos de outras redes na região.
- Pessoas em pós-campanha de conteúdo (Instagram orgânico ou pago).

`PENDENTE DE CONFIRMAÇÃO`: público exato por unidade (ex.: raio de 3 km? 5 km? bairros específicos?).

---

## Promessa e oferta

- **Promessa:** "Conheça a LoudFit por um dia."
- **Oferta:** um Day Use por pessoa, com validade limitada.
- **Diferencial:** aulas coletivas inclusas na experiência.

Copy sugerida (a validar com marca):

- Título: **"Retire seu Day Use LoudFit"**
- Sub: "Um dia inteiro para conhecer nossa estrutura e sentir a energia LoudFit."
- CTA: "Escolher unidade".

`PENDENTE DE CONFIRMAÇÃO`: promessa exata alinhada ao tom da marca.

---

## Regras da campanha

Definições sugeridas — todas precisam ser validadas com a operação:

- **Um Day Use por CPF ou por WhatsApp por período** (ex.: um a cada 90 dias).
- **Validade do voucher:** 7 dias após a geração (`PENDENTE DE CONFIRMAÇÃO`).
- **Uso só para maiores de 18 anos** (ou responsável); confirmar exigência legal.
- **Menor de idade:** exige responsável presente na recepção.
- **Voucher pessoal e intransferível.**
- **Sujeito à capacidade da unidade** — a recepção pode reagendar.
- **Documento com foto obrigatório na recepção.**

---

## Dados do formulário (planejado)

Campos mínimos para o cadastro:

| Campo | Regra | Uso |
| ----- | ----- | --- |
| `nome_completo` | Obrigatório. | Identificação na recepção. |
| `whatsapp` | Obrigatório, com validação de país. | Envio do voucher e follow-up. |
| `email` | Obrigatório. | Base de retargeting. |
| `unidade` | Obrigatório, seleção entre as seis. | Roteamento para a unidade correta. |
| `data_desejada` | Opcional (ou obrigatório se houver agenda). | Agenda / previsibilidade. |
| `origem` | Auto-preenchido pelo referrer / UTM. | Rastreamento. |
| `aceite_lgpd` | Obrigatório. | Compliance. |

`PENDENTE DE CONFIRMAÇÃO`: preciso incluir CPF? Se sim, para qual finalidade e com qual base legal LGPD.

---

## Escolha da unidade

- Seleção obrigatória.
- Padrão: dropdown com as unidades ativas (`status: 'ativa'`).
- Ipiranga durante `em_breve`: exibir mensagem "Unidade em inauguração — cadastre-se e avisamos quando abrir."
- Exibir bairro/cidade junto do nome (ex.: "LoudFit Carrefour Valinhos — Valinhos, SP").

---

## Voucher

Sugestão de conteúdo do voucher:

- Nome do usuário.
- Unidade escolhida (nome, endereço, mapa link).
- Data de validade.
- Código único (ex.: `LF-DAYUSE-XXXX`).
- QR Code opcional para leitura na recepção.
- Instruções de uso (documento, horário, o que trazer).

Formatos de entrega:

- Página `/day-use/voucher/[id]`.
- Envio automático por WhatsApp na unidade escolhida.
- Envio por e-mail com PDF ou HTML.

---

## Prevenção de uso duplicado

- Validar CPF ou WhatsApp único por período.
- Registrar voucher gerado no banco (`Supabase` ou substituto) com `status: 'gerado' | 'usado' | 'expirado'`.
- Registrar `usado` na recepção via leitura do código.
- Bloquear novo voucher enquanto houver voucher válido do mesmo usuário.

---

## Atendimento e responsabilidades da recepção

Sugestão:

- Recepcionista verifica documento com foto e código do voucher.
- Registra `usado` no sistema.
- Faz tour rápido pela unidade.
- Encaminha para professor/instrutor conforme escolha do visitante.
- No fim da visita, apresenta os planos LoudFit e o benefício da matrícula imediata.

Cada unidade deve ter um **responsável do Day Use** durante a campanha (`PENDENTE DE CONFIRMAÇÃO`).

---

## Integração com WhatsApp

- Ao gerar voucher, disparar mensagem para o WhatsApp da unidade com resumo do lead.
- Enviar ao usuário: número da unidade, link para o Google Maps, horário disponível, orientação de documento.
- Ativar botão "Falar com a unidade" apontando para o WhatsApp da unidade escolhida.

`NÃO LOCALIZADO NO REPOSITÓRIO`: nenhuma integração automática atual entre formulário e WhatsApp. Implementação exigiria webhook + provedor (Twilio, Z-API, MessageBird — a decidir).

---

## Eventos de rastreamento

Eventos sugeridos (ver `08-marketing-e-rastreamento.md`):

| Evento | Momento | Parâmetros |
| ------ | ------- | ---------- |
| `day_use_view` | Entrou na landing `/day-use`. | UTM. |
| `day_use_start` | Começou a preencher o formulário. | Unidade selecionada. |
| `day_use_submit` | Enviou o formulário com sucesso. | Unidade, origem. |
| `day_use_confirm_view` | Página de voucher visualizada. | ID do voucher. |
| `day_use_whatsapp_click` | Clicou em falar com a unidade. | Unidade. |
| `day_use_redeem` | Voucher marcado como usado pela recepção. | Unidade, data de uso. |
| `day_use_matricula` | Matrícula confirmada após Day Use. | Unidade, plano. |

Todos os eventos devem propagar UTMs para permitir análise por campanha.

---

## Página de agradecimento

Rota planejada: `/day-use/obrigado` (ou reaproveitar `/obrigado` com contexto).

Conteúdo mínimo:

- Confirmação do voucher.
- Data de validade.
- Nome e endereço da unidade escolhida.
- CTA "Ver rota no Google Maps".
- CTA "Falar com a unidade no WhatsApp".
- Reforço da comunicação: "Aulas coletivas inclusas. Vem sentir a energia."

`robots: noindex` (mesma regra do `/obrigado`).

---

## Mensagens automáticas

Templates sugeridos:

- **WhatsApp da unidade (recepção):** "🎯 Novo Day Use — Nome: {nome}. WhatsApp: {whatsapp}. Data desejada: {data}. Voucher: {codigo}."
- **WhatsApp do usuário:** "Olá {nome}! Seu Day Use LoudFit {unidade} está pronto. Traga um documento com foto. Endereço: {endereco}. Válido até {validade}."
- **E-mail do usuário:** versão em HTML do voucher.

Textos oficiais `PENDENTE DE CONFIRMAÇÃO` com marca.

---

## Indicadores (KPIs sugeridos)

- **CPL (custo por lead)** por unidade.
- **Taxa de comparecimento** (leads → presenças).
- **Taxa de conversão em matrícula** (presenças → matrículas).
- **Ticket médio das matrículas geradas por Day Use.**
- **CAC** por Day Use, comparado aos demais canais.
- **NPS presencial** ao fim da experiência.

`PENDENTE DE CONFIRMAÇÃO`: metas numéricas com o time comercial.

---

## Riscos

- **Overbooking na unidade** — muita gente marcando um dia só sobrecarrega a estrutura. Mitigar com quotas diárias.
- **Uso fraudulento** — pessoas usando múltiplas vezes. Mitigar com validação por CPF/WhatsApp e voucher único.
- **Frustração de expectativa** — se prometer avaliação e não entregar. Mitigar com copy honesta.
- **LGPD** — coleta de dado exige base legal explícita. Mitigar com aceite e política clara.
- **Custo de mídia sem retorno** — se a taxa de comparecimento for baixa. Mitigar acompanhando semanalmente.
- **Diferença de operação entre unidades** — nem todas prontas para receber visitantes na mesma cadência. Mitigar priorizando unidades maduras primeiro.

---

## Critérios de aceite

A campanha só será considerada apta para lançamento quando:

- Landing `/day-use` publicada com escolha da unidade.
- Voucher gerado com identificador único.
- Envio automático para WhatsApp funcionando (usuário + recepção).
- Página de agradecimento com `noindex`.
- Eventos de rastreamento propagando UTMs.
- Roteiro de recepção alinhado com cada unidade.
- Aceite LGPD registrado.
- Aprovação final da marca.

---

## MVP (mínimo viável)

Escopo suficiente para testar em uma unidade antes de rodar em todas:

1. Landing simples com formulário.
2. Envio para Supabase (mesmo padrão do `/api/franquia-leads`).
3. E-mail automático com voucher (sem QR Code).
4. Página `/day-use/obrigado`.
5. Aviso para a unidade via WhatsApp manual (a recepção lê e responde).
6. Rastreamento básico (`page_view`, `day_use_submit`).

---

## Fases futuras

- **Fase 2** — Voucher com QR Code e leitura na recepção.
- **Fase 3** — Painel do gestor para acompanhar comparecimento e conversão.
- **Fase 4** — Retargeting via Meta com quem começou e não terminou o cadastro.
- **Fase 5** — Fluxo de agendamento com horário específico.
- **Fase 6** — Campanha regional (ex.: apenas Anchieta e Ipiranga em SP-Capital).

---

## Próximas ações

- Confirmar promessa e oferta oficiais com a marca.
- Confirmar regras de validade e uso duplicado com a operação.
- Definir provedor de WhatsApp automatizado.
- Escolher unidade-piloto e cronograma.
- Alinhar aceite LGPD com jurídico.
- Aprovar orçamento de mídia e distribuição por unidade.
