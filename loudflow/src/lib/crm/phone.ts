// Normalização de telefones brasileiros para o CRM de leads.
//
// Regra: sempre guardamos o número bruto como foi digitado em `phone` e uma
// forma normalizada em `phone_normalized` que serve como chave anti-duplicata
// dentro da mesma organização (índice único parcial no banco).
//
// Formato alvo: E.164 com código do Brasil, ex.: "+5519997555366".
// Quando o número não tem dígitos suficientes para ser confiável, retornamos
// null em `normalized` e `isPlausible = false`, mas NÃO bloqueamos o cadastro.
// A UI mostra um aviso ("Confira o número") para o operador conferir depois.

const BR_COUNTRY = "55";

export type PhoneCheck = {
  normalized: string | null;
  isPlausible: boolean;
};

export function normalizePhone(raw: string | null | undefined): PhoneCheck {
  if (!raw) return { normalized: null, isPlausible: false };

  const digits = String(raw).replace(/\D+/g, "");
  if (!digits) return { normalized: null, isPlausible: false };

  let national = digits;

  // Remove código do país quando já veio incluso (12/13 dígitos começando em 55).
  if ((national.length === 12 || national.length === 13) && national.startsWith(BR_COUNTRY)) {
    national = national.slice(2);
  }

  // Celular BR: 10 (fixo) ou 11 (celular com 9 à frente). Aqui priorizamos celular.
  // Fixos têm 10 dígitos; para esse CRM, aceitamos 10 e 11 como "plausível".
  if (national.length === 10 || national.length === 11) {
    return { normalized: `+${BR_COUNTRY}${national}`, isPlausible: true };
  }

  // Casos onde o número veio curto (ex.: "+55 83 9648-8258" sem o 9 do celular).
  // Guardamos a forma com código do país só para rastreabilidade visual, mas
  // marcamos como implausível para o operador conferir.
  if (national.length >= 8 && national.length < 10) {
    // Não gera uma chave normalizada confiável — melhor deixar NULL do que
    // competir com outro lead e colidir no índice único.
    return { normalized: null, isPlausible: false };
  }

  return { normalized: null, isPlausible: false };
}

// Exibição humana curta a partir do bruto. Mantém dígitos mas formata para
// ficar fácil de ler. Nunca inventa um dígito faltante.
export function formatPhoneForDisplay(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = String(raw).replace(/\D+/g, "");
  if (!digits) return String(raw);

  // Normaliza para ter apenas DDD + número local (sem +55).
  let national = digits;
  if ((national.length === 12 || national.length === 13) && national.startsWith(BR_COUNTRY)) {
    national = national.slice(2);
  }

  if (national.length === 11) {
    // DDD + 9XXXX-XXXX
    return `(${national.slice(0, 2)}) ${national.slice(2, 7)}-${national.slice(7)}`;
  }
  if (national.length === 10) {
    // DDD + XXXX-XXXX (fixo ou celular antigo)
    return `(${national.slice(0, 2)}) ${national.slice(2, 6)}-${national.slice(6)}`;
  }
  // Fallback: devolve como veio para o operador decidir.
  return String(raw).trim();
}
