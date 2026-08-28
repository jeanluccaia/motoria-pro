// Deep-link canônico para o perfil 360 de um cliente. Um cliente = um destino.
// Qualquer módulo (Agent, Curadoria, Founders, Assinantes) que precisar levar
// o operador ao perfil deve usar este helper — evita divergência de rota e
// mantém o Shell V2 como wrapper único. A rota é servida por
// `app/admin/growth/customers/[id]/page.tsx`, que reaproveita
// `CustomerProfileInline` (mesmo componente do drawer da Curadoria).

export const CUSTOMER_PROFILE_ROUTE_PREFIX = "/admin/growth/customers";

export function customerProfileHref(customerId: string): string {
  return `${CUSTOMER_PROFILE_ROUTE_PREFIX}/${encodeURIComponent(customerId)}`;
}
