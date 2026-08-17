# subscriber-import — dry-run da base real DGN Club

Ferramenta **read-only**. Nunca escreve no Supabase.
Consome a planilha oficial da 4uCar e o snapshot atual do CRM
(`crm_customers`, `crm_vehicles`, `crm_subscriptions`,
`crm_campaign_members`), produzindo classificação (CREATE / UPDATE /
MERGE / CONFLICT / NO_OP / IGNORE) por registro.

## Uso

```bash
cd DGN/portal
# 1) Backup timestamped fora do repositório
node --env-file=.env.local db/scripts/subscriber-import/backup.mjs \
  "/c/Users/DELL/Desktop/jean IA/_dgn_backups/dgn-club-$(date -u +%Y-%m-%dT%H-%M-%SZ)"

# 2) Materializar planilha como JSON temporário (dentro de db/reports, que é gitignore)
node db/scripts/subscriber-import/read-xlsx.mjs \
  "/c/Users/DELL/Downloads/ASSINANTES_ATIVOS_4UCAR_2026-08-16.xlsx" \
  > db/reports/.tmp-xlsx.json

# 3) Dry-run — gera db/reports/subscriber-import-dry-run.{json,md}
node --conditions=react-server db/scripts/subscriber-import/dry-run.ts \
  --xlsx-json db/reports/.tmp-xlsx.json \
  --backup "/c/Users/DELL/Desktop/jean IA/_dgn_backups/dgn-club-<timestamp>"

# 4) Apagar o JSON temporário (contém PII)
rm db/reports/.tmp-xlsx.json
```

## Arquivos

- `read-xlsx.mjs` — leitor puro do XLSX (usa `xlsx` local).
- `backup.mjs` — dump paginado do Supabase para JSON. Sem escrita.
- `parse-spreadsheet.ts` — parser tipado das 5 abas.
- `dry-run-core.ts` — motor puro de classificação, reconciliação,
  validação de plano, detecção de "semestral legado",
  classificação de condição de pagamento e preservação de Founder.
  Reusa `lib/growth/db/normalizers.ts` e
  `lib/growth/db/reconciliation.ts`.
- `dry-run-core.test.ts` — 23 cenários; roda com `npm test`.
- `dry-run.ts` — orquestrador de I/O que emite os relatórios.

## Convenções

- Backups vivem **fora do repositório** — sugestão de raiz:
  `C:\Users\DELL\Desktop\jean IA\_dgn_backups\`.
- Relatórios ficam em `db/reports/`, que já é `.gitignore`.
- A planilha original nunca entra no Git.
- Reconciliação usa telefone > placa > nome. Nome sozinho nunca
  autoriza merge automático.
- Renovação pendente nunca vira ativo renovado.
- "Semestral" é sinalizado como `cycle_hint_from_observation`; nunca
  convertido automaticamente para `loyalty_6`.
- Pix / Cartão / Recorrência **≠** pagamento confirmado.
- Founder 001 (Benedito), 002 (José), 003 (Rikardo) sempre
  preservados quando o cliente for reconhecido.

## Ordem de aprovação

Este script para em "dry-run". Nada é aplicado sem uma etapa
posterior explicitamente autorizada (à parte deste script).
