// Filtro puro para o modal "Adicionar assinante" (aba Assinantes) e demais
// entradas operacionais que precisam localizar um cliente já cadastrado sem
// bater no banco. A lista completa é carregada server-side (loadGrowthData)
// e passada pré-sanitizada — este helper apenas filtra na memória do client.

export interface SubscriberSearchCandidate {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  hasActiveSubscription: boolean;
  activePlan: string | null;
}

const normalizeText = (value: string): string =>
  value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const digitsOnly = (value: string): string => value.replace(/\D+/g, "");

const alphaNumUpper = (value: string): string =>
  value.replace(/[^A-Za-z0-9]+/g, "").toUpperCase();

export function filterCustomersForSubscriberSearch(
  customers: readonly SubscriberSearchCandidate[],
  rawQuery: string,
  limit = 30,
): SubscriberSearchCandidate[] {
  const query = rawQuery.trim();
  // Query < 2 chars devolve vazio — evita despejar a base inteira num
  // dropdown que ninguém leu.
  if (query.length < 2) return [];

  const nameNeedle = normalizeText(query);
  const phoneNeedle = digitsOnly(query);
  const plateNeedle = alphaNumUpper(query);

  const results: SubscriberSearchCandidate[] = [];
  for (const candidate of customers) {
    if (results.length >= limit) break;

    const nameHit =
      nameNeedle.length >= 2 && normalizeText(candidate.name).includes(nameNeedle);
    const phoneHit =
      phoneNeedle.length >= 4 &&
      digitsOnly(candidate.phone).includes(phoneNeedle);
    const plateHit =
      plateNeedle.length >= 3 &&
      alphaNumUpper(candidate.plate).includes(plateNeedle);

    if (nameHit || phoneHit || plateHit) results.push(candidate);
  }
  return results;
}
