// Todas as fórmulas matemáticas do relatório de risco.
// Calculadas no client — nenhum dado pessoal vai pro servidor.

const VIG_BY_HOUSE = {
  "Bet365":      0.055,
  "Betano":      0.060,
  "Sportingbet": 0.062,
  "KTO":         0.058,
  "Betfair":     0.025,
  "Superbet":    0.060,
  "Pixbet":      0.070,
  "Novibet":     0.065,
  "Betnacional": 0.068,
  "EstrelaBet":  0.070,
  "F12.bet":     0.065,
  "Mc Games":    0.068,
  "Parimatch":   0.060,
  "Bwin":        0.060,
  "1xBet":       0.058,
};

export function estimateVig(casa) {
  return VIG_BY_HOUSE[casa] ?? 0.062;
}

export function calcProbImplicita(odd) {
  return 1 / odd;
}

export function calcProbReal(odd, casa) {
  const p = calcProbImplicita(odd);
  const v = estimateVig(casa);
  return p / (1 + v);
}

export function calcMargem(casa) {
  return estimateVig(casa);
}

// EV por aposta em reais
export function calcEV(odd, valor, casa) {
  const p = calcProbReal(odd, casa);
  return valor * (p * (odd - 1) - (1 - p));
}

// Desvio padrão de uma única aposta
export function calcSigma(odd, valor, casa) {
  const p  = calcProbReal(odd, casa);
  const ev = calcEV(odd, valor, casa);
  const ganho = valor * (odd - 1);
  const perda = -valor;
  return Math.sqrt(p * Math.pow(ganho - ev, 2) + (1 - p) * Math.pow(perda - ev, 2));
}

// Resultado esperado em N dias
export function calcResultadoDias(odd, valor, casa, frequenciaSemana, dias) {
  const ev        = calcEV(odd, valor, casa);
  const apostas   = (frequenciaSemana / 7) * dias;
  return ev * apostas;
}

// Kelly Criterion (fração ótima da banca)
export function calcKelly(odd, casa) {
  const p = calcProbReal(odd, casa);
  const b = odd - 1;
  const k = (p * b - (1 - p)) / b;
  return Math.max(0, k);
}

// Risco de ruína simplificado:
// Dado valor por aposta e banca implícita = valor * 20 unidades
export function calcRiscoRuina(odd, valor, casa) {
  const p = calcProbReal(odd, casa);
  const q = 1 - p;
  if (p >= q) return 0.02; // EV positivo — risco de ruína baixo
  const N = 20; // unidades de banca simuladas
  return Math.min(0.97, Math.pow(q / p, N));
}

// Semáforo composto
export function calcSemaforo(odd, valor, casa, sentimento, frequenciaSemana) {
  const ev  = calcEV(odd, valor, casa);
  const vig = estimateVig(casa);

  const tiltMode = sentimento === "tentando_recuperar" || sentimento === "frustrado";
  const freqAlta = frequenciaSemana >= 20;
  const oddAlta  = odd >= 3.0;
  const vigAlta  = vig >= 0.09;

  if (tiltMode)               return "VERMELHO";
  if (freqAlta && ev < 0)     return "VERMELHO";
  if (oddAlta || vigAlta)     return "VERMELHO";
  if (ev < -valor * 0.10)     return "VERMELHO";
  if (ev < 0)                 return "AMARELO";
  return "VERDE";
}

// Dados do gráfico de simulação — 31 pontos (dia 0 a 30)
export function calcSimData(odd, valor, casa, frequenciaSemana) {
  const ev    = calcEV(odd, valor, casa);
  const sigma = calcSigma(odd, valor, casa);
  const freq  = frequenciaSemana / 7; // apostas por dia

  return Array.from({ length: 31 }, (_, d) => {
    const n       = freq * d;
    const mean    = n * ev;
    const std     = Math.sqrt(Math.max(n, 0.001)) * sigma;
    return {
      day:        d,
      expected:   mean,
      optimistic: mean + 1.28 * std,
      pessimistic: mean - 1.28 * std,
    };
  });
}

// Calcula todos os indicadores de uma vez
export function calcAll(odd, valor, casa, frequenciaSemana, sentimento) {
  const o = parseFloat(String(odd).replace(",", "."));
  const v = parseFloat(String(valor).replace(",", ".")) || 0;
  const f = Number(frequenciaSemana) || 1;

  return {
    probImplicita:  (calcProbImplicita(o) * 100).toFixed(1),
    probReal:       (calcProbReal(o, casa) * 100).toFixed(1),
    margem:         (calcMargem(casa) * 100).toFixed(1),
    evReais:        calcEV(o, v, casa).toFixed(2),
    resultado30d:   calcResultadoDias(o, v, casa, f, 30).toFixed(0),
    resultado90d:   calcResultadoDias(o, v, casa, f, 90).toFixed(0),
    kelly:          (calcKelly(o, casa) * 100).toFixed(1),
    riscoRuina:     (calcRiscoRuina(o, v, casa) * 100).toFixed(0),
    semaforo:       calcSemaforo(o, v, casa, sentimento, f),
    simData:        calcSimData(o, v, casa, f),
  };
}
