const benefits = [
  {
    n: '01',
    title: 'MENSALIDADE DE MEMBRO FUNDADOR',
    desc: 'Uma tabela reservada aos convidados, abaixo do valor regular da rede',
  },
  {
    n: '02',
    title: 'CAMISETA EXCLUSIVA DE MEMBRO FUNDADOR',
    desc: 'Um símbolo de pertencimento à primeira geração da campanha, entregue após a confirmação da matrícula',
  },
  {
    n: '03',
    title: 'VANTAGENS EM PARCEIROS LOUD FIT',
    desc: 'Condições especiais em parceiros selecionados da Loud Fit',
  },
]

export function FounderBenefits() {
  return (
    <section
      className="border-t border-white/[0.10] bg-[#0A0A0A]"
      style={{
        fontFamily: 'var(--font-founder-body), Archivo, sans-serif',
        padding: 'clamp(72px, 8vw, 96px) clamp(24px, 5vw, 80px)',
      }}
    >
      <span
        className="block text-center text-[11px] font-bold uppercase tracking-[0.26em] text-[#FFE000]"
        style={{ marginBottom: '10px' }}
      >
        STATUS MEMBRO FUNDADOR
      </span>
      <p className="mx-auto mb-14 max-w-[540px] text-center text-[14.5px] leading-[1.65] text-white/60 sm:mb-12 sm:text-[15.5px]">
        Uma condição reservada para um grupo pequeno — quem chegou aqui pelo convite
      </p>

      <div className="mx-auto grid max-w-[920px] gap-11 sm:grid-cols-3 sm:gap-10 lg:gap-12">
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
