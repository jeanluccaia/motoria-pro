const UTM = 'utm_source=portal_assinante&utm_medium=app&utm_campaign=clube_dgn';

// Número central de atendimento DGN — atualizar com o número real
export const WHATSAPP_DGN = '5500000000000';

// Configure as URLs da plataforma 4U em: Admin > Links da 4U
export const urls = {
  agenda4U: `https://CONFIGURAR-URL-DA-4U/agenda?${UTM}`,
  vitrine4U: `https://CONFIGURAR-URL-DA-4U/vitrine?${UTM}`,
  whatsappVIP: `https://wa.me/${WHATSAPP_DGN}`,
};

export function whatsappAtendimento(isFounder = false): string {
  const msg = isFounder
    ? 'Olá, sou Founder DGN Club e preciso de atendimento.'
    : 'Olá, sou assinante DGN Club e preciso de atendimento.';
  return `https://wa.me/${WHATSAPP_DGN}?text=${encodeURIComponent(msg)}`;
}
