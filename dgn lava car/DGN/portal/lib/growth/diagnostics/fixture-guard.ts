// Guard puro: a fixture "TEST Customer A + HB20" só aparece atrás da env
// NEXT_PUBLIC_DIAG_HOMOLOG_FIXTURE_VISIBLE=1. Em Production essa env não é
// setada — a landing não renderiza o card fixture, e o TEST Customer não
// existe no bundle enviado ao browser.
//
// Extraído em helper puro para permitir teste unitário sem depender do
// bundler nem de process.env em runtime.

export function isDiagnosticHomologFixtureVisible(
  env: Record<string, string | undefined>,
): boolean {
  const raw = env.NEXT_PUBLIC_DIAG_HOMOLOG_FIXTURE_VISIBLE;
  if (typeof raw !== "string") return false;
  const normalized = raw.trim().toLowerCase();
  // Apenas "1", "true", "yes" ativam. Qualquer outra coisa (incluindo
  // "0", "false", "") deixa desligado. Comportamento defensivo — nunca
  // "aciona por engano" em prod se alguém setar um valor errado.
  return normalized === "1" || normalized === "true" || normalized === "yes";
}
