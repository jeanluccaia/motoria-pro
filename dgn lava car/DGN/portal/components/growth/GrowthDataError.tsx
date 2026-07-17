export function GrowthDataError({ message }: { message: string }) {
  return <main className="min-h-screen bg-[#080808] px-6 py-24 text-white"><div className="mx-auto max-w-xl rounded-2xl border border-red-400/20 bg-[#111] p-6"><p className="text-xs font-semibold uppercase tracking-widest text-red-300">DGN Growth · leitura indisponível</p><h1 className="mt-3 text-xl font-semibold">Não foi possível carregar a base administrativa.</h1><p className="mt-3 text-sm text-[#aaa]">{message}</p></div></main>;
}
