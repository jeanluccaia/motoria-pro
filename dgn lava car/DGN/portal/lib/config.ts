const UTM = 'utm_source=portal_assinante&utm_medium=app&utm_campaign=clube_dgn';

// Número central de atendimento DGN
export const WHATSAPP_DGN = '5519978146936';

// Mensagens contextuais para ações que ainda passam pelo atendimento
const MSG_AGENDA = encodeURIComponent(
  'Olá, quero agendar minha lavagem pela DGN Club.'
);
const MSG_VITRINE = encodeURIComponent(
  'Olá, quero ver os serviços extras disponíveis para assinantes DGN Club.'
);

// URLs de operação
// Enquanto a integração 4U não está disponível, agenda e vitrine caem no atendimento oficial.
export const urls = {
  agenda4U: `https://wa.me/${WHATSAPP_DGN}?text=${MSG_AGENDA}&${UTM}`,
  vitrine4U: `https://wa.me/${WHATSAPP_DGN}?text=${MSG_VITRINE}&${UTM}`,
  whatsappVIP: `https://wa.me/${WHATSAPP_DGN}`,
};

export function whatsappAtendimento(isFounder = false): string {
  const msg = isFounder
    ? 'Olá, sou Founder DGN Club e preciso de atendimento.'
    : 'Olá, sou assinante DGN Club e preciso de atendimento.';
  return `https://wa.me/${WHATSAPP_DGN}?text=${encodeURIComponent(msg)}`;
}
