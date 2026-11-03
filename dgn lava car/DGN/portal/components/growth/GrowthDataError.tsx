export function GrowthDataError({ message }: { message: string }) {
  void message;
  return <main className="px-4 py-8 sm:px-8"><div className="mx-auto max-w-xl rounded-xl border border-white/10 bg-[#101010] p-6" role="status"><p className="text-xs text-white/50">DGN · Administração</p><h1 className="mt-2 font-semibold">Dados indisponíveis</h1><p className="mt-3 text-sm text-white/60">Não foi possível carregar os dados. Tente novamente mais tarde.</p><a href="/admin/growth" className="dgn-button mt-5">Voltar à visão geral</a></div></main>;
}
