#!/usr/bin/env node
// Read-only XLSX inspector. Prints per-sheet header and rows to stdout as JSON.
// Usage: node read-xlsx.mjs <path>
import XLSX from "xlsx";
import fs from "node:fs";

const path = process.argv[2];
if (!path) {
  console.error("usage: read-xlsx.mjs <path>");
  process.exit(1);
}
if (!fs.existsSync(path)) {
  console.error("file not found:", path);
  process.exit(1);
}

const wb = XLSX.readFile(path, { cellDates: true });
const out = { file: path, sheets: [] };
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false });
  out.sheets.push({ name, rowCount: rows.length, rows });
}
process.stdout.write(JSON.stringify(out, null, 2));
