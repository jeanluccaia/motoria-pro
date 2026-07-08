import type { Metadata } from 'next'
import Image from 'next/image'
import { Section, SectionHeader } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { QualifyForm } from '@/components/sections/QualifyForm'
import { getUnits } from '@/lib/supabase'
import { UnitCard } from '@/components/ui/UnitCard'

export const metadata: Metadata = {
  title: { absolute: 'Franquias LoudFit — Seja franqueado' },
  description:
    'Seja dono de uma academia LoudFit. Conheça o modelo de franquia, investimento e o suporte da rede.',
  alternates: { canonical: '/franquias' },
  openGraph: {
    title: 'Franquias LoudFit — Seja franqueado',
    description:
      'Seja dono de uma academia LoudFit. Conheça o modelo de franquia, investimento e o suporte da rede.',
    url: '/franquias',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Franquias LoudFit — Seja franqueado',
    description:
      'Seja dono de uma academia LoudFit. Conheça o modelo de franquia, investimento e o suporte da rede.',
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

const franchiseWhatsAppUrl =
  'https://wa.me/5519988291946?text=Quero%20falar%20com%20a%20equipe%20de%20expans%C3%A3o%20da%20Loud%20Fit'

const investmentCards = [
  {
    title: 'Taxa de franquia',
    value: 'De R$ 120 mil por R$ 80 mil',
    detail: 'nas 10 primeiras unidades',
    featured: true,
  },
  {
    title: 'Investimento estimado',
    value: 'A partir de R$ 700 mil',
    detail: '+ equipamentos importados',
  },
  {
    title: 'Equipamentos',
    value: 'Parcelamento facilitado',
    detail: 'e valores abaixo do mercado',
  },
  {
    title: 'Royalties',
    value: '7%',
    detail: 'ao mês',
  },
  {
    title: 'Publicidade',
    value: '2%',
    detail: 'ao mês',
  },
  {
    title: 'Área mínima',
    value: 'A partir de 750 m²',
    detail: 'para a operação ideal',
  },
  {
    title: 'Payback médio',
    value: '15 meses',
    detail: 'em média',
  },
  {
    title: 'Lucratividade estimada',
    value: 'Entre 25% e 35%',
    detail: 'com gestão e operação consistentes',
  },
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

export default async function FranquiasPage() {
  const units = await getUnits().catch(() => [])
  const ativas = units.filter((u) => u.status === 'ativa')

  return (
    <div className="pt-16">
      {/* Hero */}
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

        {/* Linha diagonal — identidade LoudFit */}
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
                SEJA DONO DE<br />
                UMA <span className="text-lf-volt">LOUD FIT.</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-lf-muted max-w-2xl leading-relaxed">
                Uma rede de academias em expansão, com operação real, captação estruturada e um modelo criado
                para abrir unidades com tração desde o primeiro dia.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Button href="#formulario" variant="volt" size="lg">
                  Quero ser franqueado
                </Button>
                <Button href="#modelo" variant="outline" size="lg">
                  Conhecer o modelo
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {['Operação real', 'Captação pré-inauguração', 'Suporte de expansão'].map((chip) => (
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

      {/* Momento de mercado */}
      <Section bg="graphite" id="modelo">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <SectionHeader label="O mercado" title="Por que agora?" />
            <p className="text-lf-muted leading-relaxed">
              O Brasil é o <strong className="text-lf-text">2º maior mercado fitness do mundo</strong> e ainda cresce ~10% ao ano,
              com baixa penetração comparada aos EUA e Europa. O segmento premium cresce acima da média: o consumidor
              busca mais que academias de baixo custo, mas não paga pelo supérfluo de clubes de luxo.
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
              <div key={s.l} className="bg-lf-black border border-lf-line p-5 text-center">
                <span className="text-3xl font-black text-lf-volt">{s.v}</span>
                <p className="text-xs text-lf-muted mt-2 uppercase tracking-wider">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Diferenciais */}
      <Section bg="black">
        <SectionHeader label="Por que a Loud Fit" title="O que está no modelo" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {diferenciais.map((d, i) => (
            <Reveal key={d.title} delay={i * 0.1}>
              <div className="border border-lf-line p-6 hover:border-lf-volt/30 transition-colors">
                <h3 className="text-lg font-black text-lf-text uppercase">{d.title}</h3>
                <p className="mt-3 text-sm text-lf-muted leading-relaxed">{d.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Unidades reais */}
      {ativas.length > 0 && (
        <Section bg="graphite">
          <SectionHeader label="Prova real" title="As unidades que funcionam" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {ativas.map((u) => (
              <UnitCard key={u.id} unit={u} />
            ))}
          </div>
        </Section>
      )}

      {/* Números da franquia */}
      <Section bg="black">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
          <div>
            <SectionHeader
              label="Resumo do investimento"
              title="Invista em uma franquia LoudFit"
              subtitle="Uma operação validada, com estrutura premium, modelo recorrente e alto potencial de rentabilidade."
              className="mb-8"
            />
            <div className="border border-lf-volt/35 bg-lf-volt p-6 text-lf-black shadow-[0_24px_70px_rgba(255,229,0,0.12)]">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-lf-black/70">
                Oferta de expansão
              </p>
              <p className="mt-4 text-4xl font-black leading-none md:text-5xl">
                R$ 80 mil
              </p>
              <p className="mt-3 text-sm font-bold uppercase tracking-[0.08em] text-lf-black/75">
                taxa promocional para as 10 primeiras unidades
              </p>
              <p className="mt-5 text-sm leading-relaxed text-lf-black/70">
                A taxa regular é de R$ 120 mil. A condição promocional acelera a entrada de novos franqueados na fase de expansão da rede.
              </p>
            </div>
          </div>

          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {investmentCards.map((card) => (
                <Reveal key={card.title}>
                  <div
                    className={`group relative min-h-[160px] overflow-hidden border p-5 transition-colors ${
                      card.featured
                        ? 'border-lf-volt/50 bg-lf-volt/[0.08] sm:col-span-2'
                        : 'border-lf-line bg-lf-surface/45 hover:border-lf-volt/25'
                    }`}
                  >
                    {card.featured && (
                      <div className="absolute right-0 top-0 bg-lf-volt px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-lf-black">
                        10 primeiras
                      </div>
                    )}
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lf-muted">
                      {card.title}
                    </p>
                    <p className={`mt-4 font-black leading-tight ${card.featured ? 'text-3xl text-lf-volt md:text-4xl' : 'text-2xl text-lf-text'}`}>
                      {card.value}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-lf-muted">
                      {card.detail}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>

            <p className="mt-6 border-l-2 border-lf-line pl-4 text-xs leading-relaxed text-lf-muted">
              Os dados podem variar conforme cidade, ponto comercial, estrutura da unidade e negociação de equipamentos.
            </p>
            <div className="mt-8">
              <a
                href={franchiseWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] max-w-full items-center justify-center bg-lf-volt px-7 py-4 text-center text-sm font-bold uppercase leading-tight tracking-[0.1em] text-lf-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-lf-volt-deep hover:brightness-110 hover:shadow-[0_0_28px_rgba(242,226,5,0.22)] active:translate-y-0 active:scale-[0.99]"
              >
                Quero falar com a equipe de expansão
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* Aceleração LoudFit */}
      <Section bg="graphite">
        <SectionHeader label="Diferencial exclusivo" title="Aceleração Loud Fit" subtitle="Sua academia não abre vazia." />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { fase: 'Antes da inauguração', desc: 'Captação de pré-alunos, lista de espera e ações de lançamento da praça antes de abrir a porta.' },
            { fase: 'Dia da inauguração', desc: 'Protocolo de abertura, presença do time Loud Fit, cobertura de redes e primeiros alunos já no sistema.' },
            { fase: 'Primeiros 90 dias', desc: 'Acompanhamento intensivo de retenção, métricas e ajuste de operação para consolidar a base.' },
          ].map((f) => (
            <Reveal key={f.fase}>
              <div className="border border-lf-volt/20 p-6">
                <p className="text-xs uppercase tracking-widest text-lf-volt mb-3">{f.fase}</p>
                <p className="text-lf-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Processo */}
      <Section bg="black">
        <SectionHeader label="Próximos passos" title="Como funciona o processo" />
        <div className="space-y-0">
          {steps.map((s, i) => (
            <div key={s.n} className={`flex gap-6 items-start py-6 ${i < steps.length - 1 ? 'border-b border-lf-line' : ''}`}>
              <span className="text-4xl font-black text-lf-volt/30 w-12 shrink-0">{s.n}</span>
              <div>
                <h3 className="text-lg font-black text-lf-text uppercase">{s.title}</h3>
                <p className="text-sm text-lf-muted mt-1">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section bg="graphite">
        <SectionHeader label="Dúvidas" title="Perguntas frequentes" />
        <div className="space-y-0 max-w-3xl">
          {faqItems.map((item, i) => (
            <div key={i} className={`py-6 ${i < faqItems.length - 1 ? 'border-b border-lf-line' : ''}`}>
              <h3 className="font-black text-lf-text uppercase text-base">{item.q}</h3>
              <p className="mt-2 text-sm text-lf-muted leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Formulário */}
      <Section bg="black" id="formulario">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <SectionHeader label="Candidatura" title="Fale com o time de expansão" />
            <p className="text-lf-muted leading-relaxed mb-8">
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
