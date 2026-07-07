const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const wb = XLSX.readFile(path.join(__dirname, '../../DGN_Intelligence_3.3_MODELOS_EMPRESARIAIS.xlsx'));

const pfRows = XLSX.utils.sheet_to_json(wb.Sheets['Clientes PF'], { header: 1 });
const top30Rows = XLSX.utils.sheet_to_json(wb.Sheets['Top 30 Founders'], { header: 1 });
const portalRows = XLSX.utils.sheet_to_json(wb.Sheets['Portal Founders'], { header: 1 });
const ccRows = XLSX.utils.sheet_to_json(wb.Sheets['Campaign Center'], { header: 1 });

function slugify(value) {
  return String(value || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function safe(v) { return v == null ? '' : String(v).trim(); }
function safeNum(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }

function formatDateStr(value) {
  if (!value) return '';
  if (typeof value === 'number') {
    try {
      const d = XLSX.SSF.parse_date_code(value);
      return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
    } catch(e) { return ''; }
  }
  return String(value).trim();
}

function normalizePlan(value) {
  const v = String(value||'').toLowerCase();
  if (v.includes('priority')) return 'Priority';
  if (v.includes('corporate')) return 'Corporate Care';
  return 'Smart';
}

function normalizeCuraProfile(tipoVinculo) {
  const v = String(tipoVinculo||'').toLowerCase();
  if (v.includes('reembolso') || (v.includes('empresa') && v.includes('particular')) || v.includes('misto')) return 'Reembolso empresa';
  if (v.includes('corporativo') || v.includes('empresa paga')) return 'Empresa';
  if (v.includes('condomin')) return 'Condominio';
  if (v.includes('indicac') || v.includes('comunidade')) return 'Indicacao';
  if (v.includes('assinante') || v.includes('particular') || v.includes('cliente local') || v.includes('colaborador')) return 'Pessoa fisica';
  return '';
}

function normalizeOriginGroup(grupo) {
  const g = String(grupo||'');
  if (/genebra/i.test(g)) return 'Genebra';
  if (/costa.*silva/i.test(g) || /silva.*costa/i.test(g)) return 'Costa e Silva';
  if (/\bcury\b/i.test(g)) return 'Cury';
  if (/mons(o|õ)es/i.test(g)) return 'Monsoes';
  if (/taquaral/i.test(g)) return 'Taquaral';
  if (/lumini/i.test(g)) return 'Lumini';
  if (/avalon/i.test(g)) return 'Avalon';
  if (/pra(c|ç)a capital/i.test(g)) return 'Praca Capital';
  if (/medley/i.test(g)) return 'Medley';
  if (/merse/i.test(g)) return 'Merse';
  if (/radial/i.test(g)) return 'Radial';
  return 'Outro';
}

function normalizeIdealSchedule(agenda) {
  const v = String(agenda||'').toLowerCase();
  if (v.includes('semanal')) return 'Semanal';
  if (v.includes('quinzenal')) return 'Quinzenal';
  if (v.includes('mensal') || v.includes('maior freq')) return 'Mensal';
  return '';
}

function normalizeCampaignStatus(status) {
  const v = String(status||'').toLowerCase().trim();
  if (v === 'ativo') return 'Assinante ativo';
  if (v === 'validar') return 'Selecionado';
  return '';
}

function escapeStr(s) {
  return String(s||'').replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n').replace(/\r/g,'');
}

// Build lookups
const ccLookup = {};
for (const row of ccRows.slice(1)) {
  const nome = safe(row[2]);
  if (!nome) continue;
  ccLookup[nome] = {
    campanha: safe(row[0]),
    rank: row[1],
    planoSugerido: safe(row[4]),
    planoValidado: safe(row[5]),
    campaignStatus: safe(row[6]),
    ultimoContato: safe(row[7]),
    proximaAcao: safe(row[8]),
    pagePath: safe(row[10]).replace('https://app.dgnclub.com',''),
    linkPagamento: safe(row[11]),
    observacoes: safe(row[12])
  };
}

const portalLookup = {};
for (const row of portalRows.slice(1)) {
  const nome = safe(row[2]);
  if (!nome) continue;
  const url = safe(row[16]);
  portalLookup[nome] = {
    founderN: safeNum(row[0]),
    founderId: safe(row[1]),
    saudacao: safe(row[17]),
    fraseFinal: safe(row[18]),
    condicaoSmart: safe(row[14]),
    condicaoPriority: safe(row[15]),
    pagePath: url.replace('https://app.dgnclub.com',''),
    planoDestacado: safe(row[13]),
    recomendacao: safe(row[12])
  };
}

// Generate customers
const seenIds = new Set();
const customers = [];

for (const row of pfRows.slice(1)) {
  const name = safe(row[0]);
  if (!name) continue;

  let baseId = slugify(name);
  let id = baseId;
  let suffix = 2;
  while (seenIds.has(id)) { id = `${baseId}-${suffix++}`; }
  seenIds.add(id);

  const phone = String(row[2]||'').replace(/\D/g,'');
  const company = safe(row[3]);
  const vehicle = safe(row[4]) || 'A definir';
  const plate = safe(row[5]);
  const customerSince = formatDateStr(row[6]);
  const lastAttendance = formatDateStr(row[7]);
  const washCount = safeNum(row[9]);
  const historicalValue = safeNum(row[14]);
  const averageInterval = safeNum(row[16]);
  const subscriptionStatus = safe(row[18]);
  const recommendationRaw = safe(row[19]);
  const score = safeNum(row[20]);
  const originSegment = safe(row[21]);
  const grupo = safe(row[22]);
  const tipoVinculo = safe(row[23]);
  const temperatura = safe(row[24]);
  const agendaSugerida = safe(row[25]);
  const candidatoFounder = safe(row[27]);
  const curationRodrigo = safe(row[28]);
  const approveFounder = safe(row[29]);
  const founderNRaw = row[30];
  const planoValidado = safe(row[31]);
  const observacaoRodrigo = safe(row[36]);
  const statusCampanha = safe(row[37]);
  const proximaAcao = safe(row[38]);

  const recommendedPlan = normalizePlan(recommendationRaw);
  const curationProfile = normalizeCuraProfile(tipoVinculo);
  const originGroup = normalizeOriginGroup(grupo);
  const idealSchedule = normalizeIdealSchedule(agendaSugerida);

  const cc = ccLookup[name];
  const portal = portalLookup[name];

  const isFounderApproved = approveFounder === 'Sim';
  // Portal Founders is authoritative for founder status and number
  const founderSelected = portal != null || isFounderApproved;
  const founderNumber = portal ? String(portal.founderN).padStart(3,'0') : (founderNRaw ? String(Math.round(safeNum(founderNRaw))).padStart(3,'0') : '');
  const founderDecision = founderSelected ? 'Sim' : (curationRodrigo === 'Validado' ? 'Nao' : '');

  let commercialStatus;
  if (cc && cc.campaignStatus === 'Ativo') commercialStatus = 'Assinante Ativo';
  else if (founderSelected) commercialStatus = 'Selecionado Founder';
  else if (curationRodrigo === 'Validado') commercialStatus = 'Curado';
  else commercialStatus = 'Aguardando Curadoria DGN';

  const campaignStatus = normalizeCampaignStatus(cc ? cc.campaignStatus : statusCampanha);
  const personalizedPagePath = portal ? portal.pagePath : (cc ? cc.pagePath : '');
  let founderCondition = '';
  if (portal) {
    founderCondition = normalizePlan(recommendationRaw) === 'Priority' ? portal.condicaoPriority : portal.condicaoSmart;
  } else if (planoValidado) {
    founderCondition = planoValidado;
  }

  const recurrence = temperatura === 'Quente' ? 'Alta frequencia confirmada'
    : temperatura === 'Morno-quente' ? 'Boa recorrencia'
    : temperatura === 'Morno' ? 'Recorrencia moderada'
    : 'Frequencia a validar';

  customers.push({
    id, name, phone, vehicle, plate,
    companyLink: company,
    origin: originSegment || 'DGN Intelligence 3.3',
    attendanceHistory: subscriptionStatus ? [subscriptionStatus] : [],
    washCount, historicalValue, customerSince, lastAttendance,
    scoreDgn: score,
    recommendedPlan,
    commercialStatus,
    recurrence,
    averageVisitIntervalDays: averageInterval,
    curation: {
      profile: curationProfile,
      originGroup,
      commercialProfile: '',
      idealSchedule,
      founderDecision,
      founderNumber,
      internalNotes: escapeStr(observacaoRodrigo)
    },
    campaign: {
      currentCampaign: (cc || founderSelected) ? 'Founders 2026' : '',
      founderSelected: founderSelected,
      founderNumber,
      founderCondition: founderCondition || '',
      campaignStatus,
      personalizedPagePath,
      paymentLink: cc ? cc.linkPagamento : '',
      lastAction: cc ? (cc.campaignStatus === 'Ativo' ? 'Assinatura confirmada' : 'Validar curadoria') : 'Cliente importado',
      nextAction: escapeStr(cc ? cc.proximaAcao : (proximaAcao || 'Aguardando Curadoria DGN')),
      lastContact: cc ? cc.ultimoContato : '',
      conversationStatus: cc ? cc.campaignStatus : '',
      notes: escapeStr(observacaoRodrigo || (cc ? cc.observacoes : ''))
    }
  });
}

// Stats
const founders = customers.filter(c => c.campaign.founderSelected);
console.log('Total clientes:', customers.length);
console.log('Founders selecionados:', founders.length);
console.log('Founders com pagina:', founders.filter(c => c.campaign.personalizedPagePath).length);
console.log('Assinantes Ativos:', customers.filter(c => c.commercialStatus === 'Assinante Ativo').length);
console.log('Jose Moreira id:', customers.find(c => c.name === 'Jose Moreira')?.id);
console.log('Jose Moreira founderNumber:', customers.find(c => c.name === 'Jose Moreira')?.curation.founderNumber);
console.log('Jose Moreira pagePath:', customers.find(c => c.name === 'Jose Moreira')?.campaign.personalizedPagePath);
console.log('Benedito founderNumber:', customers.find(c => c.name === 'Benedito Constantino')?.curation.founderNumber);
console.log('Iara id:', customers.find(c => c.name === 'Iara')?.id);
console.log('Iara founderNumber:', customers.find(c => c.name === 'Iara')?.curation.founderNumber);

// Write JSON
fs.writeFileSync(path.join(__dirname, 'lib/growth/dgn-customers.json'), JSON.stringify(customers, null, 0));
console.log('JSON written successfully');
