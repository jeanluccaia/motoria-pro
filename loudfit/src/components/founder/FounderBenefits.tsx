const benefits = [
  {
    n: '01',
    title: 'ACESSO ANTECIPADO',
    desc: 'Conheça a unidade antes da abertura oficial, quando essa experiência estiver disponível',
  },
  {
    n: '02',
    title: 'INFORMAÇÕES EM PRIMEIRA MÃO',
    desc: 'Receba novidades, horários e programação antes do público geral',
  },
  {
    n: '03',
    title: 'PRIMEIRA GERAÇÃO LOUD FIT',
    desc: 'Faça parte dos primeiros membros da campanha de lançamento',
  },
]

export function FounderBenefits() {
  return (
    <section
      className="border-t border-white/[0.10] bg-[#0A0A0A]"
      style={{
        fontFamily: 'var(--font-founder-body), Archivo, sans-serif',
        padding: 'clamp(48px, 7vw, 80px) clamp(22px, 5vw, 80px)',
      }}
    >
      <span
        className="block text-center text-[11px] font-bold uppercase tracking-[0.26em] text-[#FFE000]"
        style={{ marginBottom: '10px' }}
      >
        STATUS MEMBRO FUNDADOR
      </span>
      <p className="mx-auto mb-10 max-w-[520px] text-center text-[14px] leading-[1.55] text-white/60 sm:text-[15px]">
        Você não está apenas entrando em uma academia — está entrando desde o começo
      </p>

      <div className="mx-auto grid max-w-[920px] gap-8 sm:grid-cols-3 sm:gap-10 lg:gap-12">
        {benefits.map((b) => (
          <div key={b.n} className="border-t border-white/[0.10] pt-5 sm:pt-6">
            <span
              className="block"
              style={{
                fontFamily: 'var(--font-founder-display), Anton, sans-serif',
                color: '#FFE000',
                fontSize: '26px',
                lineHeight: 1,
              }}
            >
              {b.n}
            </span>
            <h3
              className="mt-3 text-[14.5px] font-extrabold uppercase leading-[1.2] tracking-[0.04em] text-lf-text sm:text-[15px]"
              style={{ fontFamily: 'var(--font-founder-body), Archivo, sans-serif' }}
            >
              {b.title}
            </h3>
            <p className="mt-2 text-[14px] leading-[1.55] text-white/60">{b.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
