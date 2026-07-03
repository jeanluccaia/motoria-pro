const terms = [
  { text: 'LoudFit', accent: true },
  { text: '✦', accent: true, small: true },
  { text: 'Energia Real', accent: false },
  { text: '✦', accent: false, small: true },
  { text: 'Sala Cheia', accent: false },
  { text: '✦', accent: false, small: true },
  { text: 'Treino Sério', accent: false },
  { text: '✦', accent: false, small: true },
]

function Strip() {
  return (
    <span className="flex shrink-0 items-center gap-6 pr-6 lg:gap-10 lg:pr-10">
      {terms.map((t, i) => (
        <span
          key={i}
          className={
            t.small
              ? 'text-lf-volt/40 text-2xl lg:text-3xl'
              : t.accent
              ? 'text-lf-volt'
              : 'text-lf-text/20'
          }
        >
          {t.text}
        </span>
      ))}
    </span>
  )
}

export function BrandMarquee() {
  return (
    <div
      className="overflow-hidden border-y border-lf-line py-5 bg-lf-black"
      aria-hidden="true"
    >
      <div
        className="lf-marquee whitespace-nowrap font-display text-4xl font-black uppercase tracking-tight sm:text-5xl lg:text-6xl"
      >
        <Strip />
        <Strip />
      </div>
    </div>
  )
}
