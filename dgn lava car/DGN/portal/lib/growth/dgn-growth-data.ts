import "server-only";
import rawCustomers from "./dgn-customers.json" with { type: "json" };
import type { DgnCustomer } from "./dgn-growth-utils.ts";
import { isOperationalDgnCustomer } from "./dgn-growth-utils.ts";

// -----------------------------------------------------------------------------
// SERVER-ONLY. Este módulo é o único que importa o dataset `dgn-customers.json`
// (2.354 clientes, com PII completa). Ele NÃO pode aparecer em nenhum grafo de
// módulos de client bundle — o marker `import "server-only"` força erro em
// build se algum client component tentar importar.
//
// Client components devem importar de `./dgn-growth-utils.ts` (mesmo tipos, mas
// sem side effect do JSON).
// -----------------------------------------------------------------------------

// Re-exporta a API pública para preservar imports server-side existentes.
export * from "./dgn-growth-utils.ts";
import { matchesDgnCustomerSearch } from "./dgn-growth-utils.ts";

const importedCustomers = rawCustomers as unknown as DgnCustomer[];

export const allDgnCustomers: DgnCustomer[] = importedCustomers;

export const dgnCustomers: DgnCustomer[] = allDgnCustomers.filter(isOperationalDgnCustomer);

export function getCustomerById(id: string) {
  return dgnCustomers.find((customer) => customer.id === id);
}

// Server-only: default para o dataset do JSON. Client deve chamar
// matchesDgnCustomerSearch diretamente passando sua lista in-memory.
export function searchDgnCustomers(query: string, customers: DgnCustomer[] = dgnCustomers) {
  return customers.filter((customer) => matchesDgnCustomerSearch(customer, query));
}
