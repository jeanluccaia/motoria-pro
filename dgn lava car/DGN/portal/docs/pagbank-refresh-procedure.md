# Procedimento seguro para atualizar o snapshot PagBank

> Última revisão: 2026-09-22 (Fase 4 · Jean autorizou código + dry-run;
> **nenhuma execução `--apply` autorizada** nesta janela).

## Contexto

- O CRM tem hoje 13 assinaturas PagBank importadas em **2026-09-01**
  (`billing_due_source = "pagbank:snapshot-2026-09-01"`,
  `last_verified_at ≈ 2026-09-02T23:27 UTC`). Nenhum refresh desde então.
- `next_due_date` de várias delas está no passado — isso reflete apenas
  a defasagem do snapshot; PagBank provavelmente já cobrou automaticamente
  os cartões recorrentes. O CRM não sabe.
- A UI (Fase 4) marca essas subs como **PAGBANK_STALE · "verifique
  PagBank"** quando `now - last_verified_at > 7 dias`.

## O que este procedimento NÃO faz

- Não confirma pagamento novo sem evidência do provedor.
- Não substitui recibo (PIX/TED/boleto) por decisão administrativa.
- Não altera `payment_verification_status` de sub manual.
- Não roda `--apply` sem autorização explícita do Jean, por sub, com
  gate de segurança verde.

## Passo a passo

### 1. Obter o snapshot atual do PagBank

O importador consome um JSON no formato definido em
`lib/portal/pagbank-import/types.ts` (`PagBankImportFile`). Os campos
mínimos por contrato:

- `provider_subscription_id` — **obrigatório**, chave de idempotência.
- `provider_customer_id` — canonicamente populado; único identificador
  confiável de pessoa vindo do provedor.
- `customer_name`, `customer_phone`, `customer_cpf` (opcional, se
  autorizado), `customer_email` (frequentemente mascarado).
- `plan` (Essential/Smart/Priority), `cycle` (`mensal`), `amount_monthly`.
- `status` (ACTIVE/PENDING/CANCELLED/ENDED), `payment_method`
  (CARD_RECURRING/MANUAL/UNKNOWN), `payment_status`
  (CONFIRMED/PENDING/FAILED/REFUNDED/UNKNOWN),
  `payment_evidence_source` (**PROVIDER** para linhas confirmadas por
  PagBank), `migration_status`.
- `next_due_date`, `last_payment_confirmed_at` (ISO), `started_at`.
- Opcional: `vehicle_plate`, `vehicle_brand`, `vehicle_model`, `note`.

**Origem do arquivo:** exportar pelo painel do PagBank (ou API oficial
do provedor). Fluxo operacional atual:

1. Digo/Jean acessa PagBank e gera o extrato de assinaturas ativas.
2. Salva como JSON no formato acima em
   `.data/pagbank/subscriptions-YYYY-MM-DD.json` (**gitignored** — o
   arquivo real nunca vai pro repositório).
3. Opcional: preparar um arquivo de reconciliação humana
   (`.data/pagbank/reconciliation-YYYY-MM-DD.json`) com as decisões
   `APPROVED`/`NEW_CUSTOMER`/`subscription_overrides` para linhas em
   dúvida da rodada anterior.

Se o painel PagBank não expor JSON diretamente, converter o CSV
oficial via script auxiliar antes da execução — nunca digitar valores
à mão nem colar do WhatsApp.

### 2. Executar o dry-run

```bash
cd DGN/portal

node --env-file=.env.local --conditions=react-server --experimental-strip-types \
  scripts/import-pagbank-subscriptions.ts \
  --file=.data/pagbank/subscriptions-2026-09-22.json \
  --source-label=pagbank:snapshot-2026-09-22
```

- `--source-label` é **obrigatório** e viaja para `billing_due_source`
  em cada sub PagBank. Nunca reaproveitar o rótulo anterior.
- Sem `--apply` → dry-run: nenhum write.
- Se houver arquivo de reconciliação humana:
  `--reconciliation=.data/pagbank/reconciliation-2026-09-22.json`.

### 3. Ler o relatório

O relatório imprime:

- **Rows lidas** e **Provider customers únicos** — total do arquivo.
- **Matched** — customers resolvidos por identidade forte (reconciliation
  / provider_id / cpf / telefone).
- **New customer planned** — PagBank trouxe cliente novo confirmado
  humanamente via arquivo de reconciliação.
- **Review required** — casos que exigem decisão humana:
  - `MANUAL_PROVIDER_OVERLAP` (Fase 4): customer já tem sub manual ativa
    → NÃO cria sub PagBank paralela. Bloco dedicado no relatório mostra
    os dois contratos candidatos lado a lado.
  - `FINANCIAL_REVIEW`: David-like (2+ subs mesmo PagBank customer sem
    placa distinta).
- **Pending reconciliation** — customer inexistente/ambíguo no CRM.
- **Duplicates** — `provider_subscription_id` já persistido; vira
  `update_subscription` idempotente.
- **Would create subs** / **Would update subs** — antevisão exata do
  volume de escritas.
- **Manual↔provider overlaps** — contador dedicado da Fase 4.

Além dos totais, blocos explicativos:
- `MANUAL ↔ PROVIDER OVERLAP` — decisão humana obrigatória.
- `FINANCIAL REVIEW REQUIRED` — David-like.
- `PENDING RECONCILIATION` — customer não resolvido.
- `NEW_CUSTOMER (planned create)` — quem seria criado.

### 4. Diagnóstico esperado do dry-run (nesta rodada)

Antecipando a leitura hoje (2026-09-22) com o snapshot vivo:

- **Contratos existentes atualizáveis**: 13 duplicates (os PagBank já
  persistidos). `subscriptions_would_update = 13`.
  `subscriptions_would_create = 0` **se o arquivo trouxer o mesmo
  conjunto de contratos**. Cada linha carrega o novo `next_due_date`,
  `last_payment_confirmed_at` mais recente, mas o CLI:
  - preserva `notes` quando não há nova observação;
  - preserva `subscription_detected_at` original;
  - grava `billing_due_source = pagbank:snapshot-2026-09-22`;
  - grava `last_verified_at = now()`.
- **Novos contratos**: 0 esperados, a menos que o cliente tenha
  contratado no PagBank algum plano depois de 2026-09-01. Caso apareça
  contrato novo:
  - se `provider_customer_id` bate com um customer já no CRM (por
    provider_id/telefone/cpf) → `matched` + `create_subscription`.
  - se o customer é conhecido do CRM mas tem sub **manual ativa** →
    `review_required` com `flag_manual_provider_overlap`. **Nada
    é criado sem decisão humana.**
  - se o customer é desconhecido → `pending_reconciliation`.
- **Possíveis sobreposições com assinaturas manuais**: os 4 Founders
  (Benedito, Jose Moreira, Rikardo, Wellington) HOJE não têm
  `provider_customer_id`. Se em algum momento o PagBank passar a
  identificar essas assinaturas, a nova regra faz o overlap emergir
  como review — não gera sub paralela.
- **Registros que exigem revisão financeira**: David (2 subs mesmo
  `CUST_B5274A77` sem placa distinta) reaparecerá com `financial_review`
  se o novo snapshot repetir o padrão. Aceita `subscription_overrides`
  no arquivo de reconciliação com evidência de placa por contrato para
  desflagelar.
- **Quantidade de escritas previstas**: 0 (dry-run). Coluna
  `subscriptions_would_create/update` só mostra o número que **teria**
  sido escrito em `--apply`.
- **Diferenças de estado e datas**: verificar coluna
  `financial_reviews_flagged`, `manual_provider_overlaps`, e a lista
  detalhada em `MANUAL ↔ PROVIDER OVERLAP`. Se algo aparecer inesperado,
  travar antes de considerar `--apply`.

### 5. Gate para `--apply` (barrar automaticamente)

O script recusa `--apply` se qualquer condição falhar:
- `errors > 0`
- `pending_reconciliation_customers > 0` ou `pending_reconciliation_rows > 0`
- `manual_provider_overlaps > 0` (Fase 4)
- Alguma row com outcome fora do conjunto {matched, new_customer_planned,
  duplicate} sem link+create/update no plano de ações.

Passar todos os gates é condição necessária mas **não suficiente** —
autorização humana explícita por Jean continua obrigatória.

### 6. Resolução das pendências antes de `--apply`

Para cada linha em `MANUAL ↔ PROVIDER OVERLAP`, a operação humana
precisa decidir uma de duas opções, **por sub manual**:

- **Mesmo contrato em duas representações**: o PagBank ativou a
  cobrança que a sub manual só declarava. A resolução correta é:
  atualizar a sub manual existente com os dados PagBank (via editor
  manual da ficha ou fluxo dedicado) e cancelar a "planned create"
  desta linha no import. Não implementado como automação — fluxo
  humano com comprovante do provedor.
- **Dois contratos legítimos**: cliente contratou uma segunda linha
  PagBank de propósito (padrão José Sergio) e a sub manual continua
  valendo pra outra circunstância. Resolver adicionando entrada
  `APPROVED` no arquivo de reconciliação (aponta o customer certo) +
  `subscription_overrides` com placa/veículo se possível, e reexecutar
  dry-run. O flag some quando o snapshot deixa de trazer conflito real
  (subs distintas com veículos/placa distintas).

Só após resolver TODOS os overlaps é que faz sentido pensar em
`--apply`.

### 7. Execução do apply (fora do escopo desta janela)

Requer autorização explícita do Jean, com:
- Dry-run publicado e revisado (arquivo do report em
  `.data/pagbank/reports/apply-<timestamp>.json`).
- 0 overlaps, 0 pending_reconciliation, 0 errors.
- Backup baseline do CRM (`SELECT` das 13 subs PagBank + qualquer sub
  manual ativa que pudesse ser tocada) armazenado fora do banco.
- Verificação prévia dos 4 Founders — comprovar que continuam sem
  `provider_customer_id` (senão o import precisa considerá-los).

Nada disso é feito nesta janela. Este documento é procedimento
prescritivo, não relato de execução.
