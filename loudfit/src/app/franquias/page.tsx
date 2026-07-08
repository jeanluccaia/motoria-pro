import type { Metadata } from 'next'
import Image from 'next/image'
import { Section, SectionHeader } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { QualifyForm } from '@/components/sections/QualifyForm'
import { getUnits } from '@/lib/supabase'
import { UnitCard } from '@/components/ui/UnitCard'

export const metadata: Metadata = {
  title: { absolute: 'Franquias Loud Fit — Seja franqueado' },
  description:
    'Seja dono de uma academia Loud Fit. Conheça o modelo de franquia, investimento e o suporte da rede.',
  alternates: { canonical: '/franquias' },
  openGraph: {
    title: 'Franquias Loud Fit — Seja franqueado',
    description:
      'Seja dono de uma academia Loud Fit. Conheça o modelo de franquia, investimento e o suporte da rede.',
    url: '/franquias',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Franquias Loud Fit — Seja franqueado',
    description:
      'Seja dono de uma academia Loud Fit. Conheça o modelo de franquia, investimento e o suporte da rede.',
    images: ['/opengraph-image'],
  },
}

const diferenciais = [
  { title: 'Marca que atrai', body: 'Identidade premium que já tem reconhecimento nas praças onde operamos.' },
  { title: 'Aceleração Loud Fit', body: 'Sua unidade não abre vazia. Metodologia própria de captação pré e pós-inauguração.' },
  { title: 'Playbook completo', body: 'Gestão, operação, marketing e captação documentados. Não reinventa a roda.' },
  { title: 'Suporte contínuo', body: 'Time de expansão, operação e marketing ao lado da sua unidade desde o dia 1.' },
]

const steps = [
  { n: '01', title: 'Preencheu o formulário', body: 'Nossa equipe recebe e analisa seu perfil.' },
  { n: '02', title: 'Call de qualificação', body: 'Conversa de 30min para entender seu perfil e praça.' },
  { n: '03', title: 'Apresentação completa', body: 'Números, modelo de operação e tour nas unidades.' },
  { n: '04', title: 'Análise de praça', body: 'Estudo do ponto e aprovação da localização.' },
  { n: '05', title: 'Assinatura e kick-off', body: 'Contrato assinado. Aceleração Loud Fit começa.' },
]

const faqItems = [
  {
    q: 'Preciso entender de academia para ser franqueado?',
    a: 'Não. O playbook cobre gestão, operação e equipe. Você precisa de perfil empreendedor e capital disponível.',
  },
  {
    q: 'Qual o investimento total?',
    a: 'O investimento estimado parte de R$ 700 mil + equipamentos importados, com variação conforme cidade, ponto comercial e estrutura da unidade.',
  },
  {
    q: 'Quanto tempo até abrir?',
    a: 'Em média 4 a 6 meses após a assinatura do contrato, dependendo da obra e do ponto.',
  },
  {
    q: 'A Loud Fit ajuda a encontrar o ponto?',
    a: 'Sim. Nosso time faz a análise de praça e dá parecer técnico sobre o ponto antes de qualquer comprometimento.',
  },
]

const franchiseWhatsAppUrl =
  'https://wa.me/5519988291946?text=Quero%20falar%20com%20a%20equipe%20de%20expans%C3%A3o%20da%20Loud%20Fit'

const investmentCards = [
  {
    title: 'Investimento estimado',
    value: 'A partir de R$ 700 mil',
    detail: '+ equipamentos importados',
  },
  {
    title: 'Equipamentos',
    value: 'Parcelamento facilitado',
    detail: 'Condição negociada para implantação da unidade.',
  },
  {
    title: 'Royalties',
    value: '7%',
    detail: 'ao mês',
  },
  {
    title: 'Publicidade',
    value: '2%',
    detail: 'para fortalecimento e captação local',
  },
  {
    title: 'Área mínima',
    value: 'A partir de 750 m²',
    detail: 'estrutura compatível com o modelo Loud Fit',
  },
]

export default async function FranquiasPage() {
  const units = await getUnits().catch(() => [])
  const ativas = units.filter((u) => u.status === 'ativa')

  return (
    <div className="pt-16">

      {/* ─── 1. Hero ─────────────────────────────────────────────── */}
      <section className="relative flex min-h-[620px] items-end overflow-hidden bg-lf-black py-16 sm:min-h-[680px] md:min-h-[75vh] md:py-24 lg:min-h-[85vh] lg:py-28">
        <Image
          src="/assets/images/real-facade.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover object-[50%_35%]"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,9,0.55)_0%,rgba(9,9,9,0.4)_38%,rgba(9,9,9,0.94)_100%),linear-gradient(90deg,rgba(9,9,9,0.9)_0%,rgba(9,9,9,0.3)_55%,rgba(9,9,9,0.88)_100%)]" />

        <div className="absolute bottom-0 left-0 right-0 h-px bg-lf-line" />
        <div className="absolute bottom-0 left-0 h-[3px] w-48 -skew-x-12 origin-left bg-lf-volt" />

        <div className="relative z-10 mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <div className="max-w-4xl">
            <Reveal>
              <div className="mb-5 flex items-center gap-3">
                <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
                  Franquias Loud Fit
                </p>
              </div>
              <h1
                className="font-black uppercase leading-[1.05] text-lf-text"
                style={{ fontSize: 'clamp(2.6rem, 5.5vw, 6rem)' }}
              >
                ABRA UMA <span className="text-lf-volt">LOUD FIT</span><br />
                NA SUA REGIÃO.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-lf-muted md:text-xl">
                Uma rede de academias com operação real, modelo comercial validado e suporte para expansão.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button href="#formulario" variant="volt" size="lg">
                  Quero ser franqueado
                </Button>
                <Button href="#investimento" variant="outline" size="lg">
                  Ver investimento
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {['Operação real', 'Modelo recorrente', 'Suporte de expansão'].map((chip) => (
                  <span
                    key={chip}
                    className="border border-white/15 bg-white/[0.07] px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-lf-text/90 backdrop-blur-[2px]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── 2. Resumo do investimento ───────────────────────────── */}
      <Section bg="graphite" id="investimento">
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-[3px] w-8 shrink-0 bg-lf-volt" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lf-volt">
              Investimento
            </p>
          </div>
          <h2 className="text-3xl font-black leading-[1.02] text-lf-text md:text-4xl">
            Resumo do investimento
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-lf-muted">
            Condições comerciais para novos franqueados Loud Fit na fase de expansão da rede.
          </p>
        </div>

        {/* Card principal — taxa promocional */}
        <div className="mb-6 relative overflow-hidden border border-lf-volt/25 bg-lf-black">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-lf-volt" />
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8 lg:gap-10">
            <div className="pl-4">
              <span className="mb-4 inline-block bg-lf-volt px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-lf-black">
                10 primeiras unidades
              </span>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lf-muted">
                Taxa de franquia promocional
              </p>
              <p className="mt-3 text-5xl font-black leading-none text-lf-text md:text-6xl">
                R$ 80 mil
              </p>
            </div>
            <div className="border-t border-lf-line pl-4 pt-4 md:max-w-sm md:border-l md:border-l-lf-line md:border-t-0 md:pl-8 md:pt-0">
              <p className="text-sm leading-relaxed text-lf-muted">
                Taxa regular de R$ 120 mil. Condição promocional para acelerar a entrada de novos
                franqueados na fase de expansão da rede.
              </p>
            </div>
          </div>
        </div>

        {/* Cards secundários */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {investmentCards.map((card) => (
            <Reveal key={card.title}>
              <div className="border border-lf-line bg-lf-black/40 p-5 transition-colors hover:border-lf-volt/20">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lf-muted">
                  {card.title}
                </p>
                <p className="mt-3 text-2xl font-black leading-tight text-lf-text">
                  {card.value}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-lf-muted">
                  {card.detail}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-lg border-l-2 border-lf-line pl-4 text-xs leading-relaxed text-lf-muted/70">
            Dados estimados. Payback médio: ~15 meses. Lucratividade estimada: 25–35%.
            Valores podem variar conforme cidade, ponto comercial e estrutura da unidade.
            Consulte o COF e a Lei de Franquias antes de assinar qualquer contrato.
          </p>
          <a
            href={franchiseWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 min-h-[48px] items-center justify-center bg-lf-volt px-7 py-3 text-sm font-bold uppercase tracking-[0.1em] text-lf-black transition-all hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.99]"
          >
            Falar com a equipe de expansão
          </a>
        </div>
      </Section>

      {/* ─── 3. Por que agora ───────────────────────────────────── */}
      <Section bg="black" id="modelo">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <SectionHeader label="O mercado" title="Por que agora?" />
            <p className="leading-relaxed text-lf-muted">
              O Brasil é o <strong className="text-lf-text">2º maior mercado fitness do mundo</strong> e ainda
              cresce ~10% ao ano, com baixa penetração comparada aos EUA e Europa. O segmento premium cresce
              acima da média: o consumidor busca mais que academias de baixo custo, mas não paga pelo supérfluo
              de clubes de luxo.
            </p>
            <p className="mt-4 text-xs text-lf-muted">
              Fontes: IHRSA / ACAD Brasil. Dados de mercado de referência pública.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { v: '2º', l: 'maior mercado fitness do mundo' },
              { v: '~10%', l: 'crescimento anual do setor' },
              { v: 'baixa', l: 'penetração vs. mercados maduros' },
              { v: '+', l: 'demanda por premium acessível' },
            ].map((s) => (
              <div key={s.l} className="border border-lf-line bg-lf-graphite p-5 text-center">
                <span className="text-3xl font-black text-lf-volt">{s.v}</span>
                <p className="mt-2 text-xs uppercase tracking-wider text-lf-muted">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── 4. O que está no modelo ────────────────────────────── */}
      <Section bg="graphite">
        <SectionHeader label="Por que a Loud Fit" title="O que está no modelo" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {diferenciais.map((d, i) => (
            <Reveal key={d.title} delay={i * 0.1}>
              <div className="border border-lf-line p-6 transition-colors hover:border-lf-volt/30">
                <h3 className="text-lg font-black uppercase text-lf-text">{d.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-lf-muted">{d.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ─── 5. Unidades reais ──────────────────────────────────── */}
      {ativas.length > 0 && (
        <Section bg="black">
          <SectionHeader label="Prova real" title="As unidades que funcionam" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ativas.map((u) => (
              <UnitCard key={u.id} unit={u} />
            ))}
          </div>
        </Section>
      )}

      {/* ─── 6. Aceleração Loud Fit ─────────────────────────────── */}
      <Section bg="graphite">
        <SectionHeader label="Diferencial exclusivo" title="Aceleração Loud Fit" subtitle="Sua academia não abre vazia." />
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { fase: 'Antes da inauguração', desc: 'Captação de pré-alunos, lista de espera e ações de lançamento da praça antes de abrir a porta.' },
            { fase: 'Dia da inauguração', desc: 'Protocolo de abertura, presença do time Loud Fit, cobertura de redes e primeiros alunos já no sistema.' },
            { fase: 'Primeiros 90 dias', desc: 'Acompanhamento intensivo de retenção, métricas e ajuste de operação para consolidar a base.' },
          ].map((f) => (
            <Reveal key={f.fase}>
              <div className="border border-lf-volt/20 p-6">
                <p className="mb-3 text-xs uppercase tracking-widest text-lf-volt">{f.fase}</p>
                <p className="text-sm leading-relaxed text-lf-muted">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ─── 7. Processo ────────────────────────────────────────── */}
      <Section bg="black">
        <SectionHeader label="Próximos passos" title="Como funciona o processo" />
        <div className="space-y-0">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className={`flex items-start gap-6 py-6 ${i < steps.length - 1 ? 'border-b border-lf-line' : ''}`}
            >
              <span className="w-12 shrink-0 text-4xl font-black text-lf-volt/30">{s.n}</span>
              <div>
                <h3 className="text-lg font-black uppercase text-lf-text">{s.title}</h3>
                <p className="mt-1 text-sm text-lf-muted">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── 8. FAQ ─────────────────────────────────────────────── */}
      <Section bg="graphite">
        <SectionHeader label="Dúvidas" title="Perguntas frequentes" />
        <div className="max-w-3xl space-y-0">
          {faqItems.map((item, i) => (
            <div key={i} className={`py-6 ${i < faqItems.length - 1 ? 'border-b border-lf-line' : ''}`}>
              <h3 className="text-base font-black uppercase text-lf-text">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-lf-muted">{item.a}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── 9. Formulário ──────────────────────────────────────── */}
      <Section bg="black" id="formulario">
        <div className="grid items-start gap-12 md:grid-cols-2">
          <div>
            <SectionHeader label="Candidatura" title="Fale com o time de expansão" />
            <p className="mb-8 leading-relaxed text-lf-muted">
              Preencha o formulário. Nosso time analisa o perfil e entra em contato em até 48h úteis.
              Não trabalhamos com pressão de venda — se não for o momento certo, a gente fala isso.
            </p>
          </div>
          <QualifyForm />
        </div>
      </Section>

    </div>
  )
}
