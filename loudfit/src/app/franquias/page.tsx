import type { Metadata } from 'next'
import { Section, SectionHeader } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { QualifyForm } from '@/components/sections/QualifyForm'
import { getUnits } from '@/lib/supabase'
import { UnitCard } from '@/components/ui/UnitCard'

export const metadata: Metadata = {
  title: 'Seja Franqueado — LoudFit',
  description:
    'Seja dono de uma academia LoudFit. Conheça o modelo de franquia, investimento e o suporte da rede.',
}

const diferenciais = [
  { title: 'Marca que atrai', body: 'Identidade premium que já tem reconhecimento nas praças onde operamos.' },
  { title: 'Aceleração LoudFit', body: 'Sua unidade não abre vazia. Metodologia própria de captação pré e pós-inauguração.' },
  { title: 'Playbook completo', body: 'Gestão, operação, marketing e captação documentados. Não reinventa a roda.' },
  { title: 'Suporte contínuo', body: 'Time de expansão, operação e marketing ao lado da sua unidade desde o dia 1.' },
]

const steps = [
  { n: '01', title: 'Preencheu o formulário', body: 'Nossa equipe recebe e analisa seu perfil.' },
  { n: '02', title: 'Call de qualificação', body: 'Conversa de 30min para entender seu perfil e praça.' },
  { n: '03', title: 'Apresentação completa', body: 'Números, modelo de operação e tour nas unidades.' },
  { n: '04', title: 'Análise de praça', body: 'Estudo do ponto e aprovação da localização.' },
  { n: '05', title: 'Assinatura e kick-off', body: 'Contrato assinado. Aceleração LoudFit começa.' },
]

const faqItems = [
  {
    q: 'Preciso entender de academia para ser franqueado?',
    a: 'Não. O playbook cobre gestão, operação e equipe. Você precisa de perfil empreendedor e capital disponível.',
  },
  {
    q: 'Qual o investimento total?',
    a: 'O investimento varia conforme o tamanho do espaço e a praça. O time de expansão apresenta os números detalhados na call de qualificação.',
  },
  {
    q: 'Quanto tempo até abrir?',
    a: 'Em média 4 a 6 meses após a assinatura do contrato, dependendo da obra e do ponto.',
  },
  {
    q: 'A LoudFit ajuda a encontrar o ponto?',
    a: 'Sim. Nosso time faz a análise de praça e dá parecer técnico sobre o ponto antes de qualquer comprometimento.',
  },
]

export default async function FranquiasPage() {
  const units = await getUnits().catch(() => [])
  const ativas = units.filter((u) => u.status === 'ativa').slice(0, 4)

  return (
    <div className="pt-16">
      {/* Hero */}
      <Section bg="black">
        <div className="max-w-4xl">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.3em] text-lf-volt mb-6">Franquias</p>
            <h1 className="text-6xl md:text-8xl font-black text-lf-text leading-none">
              SEJA DONO DE<br />
              <span className="text-lf-volt">UMA LOUDFIT.</span>
            </h1>
            <p className="mt-6 text-xl text-lf-muted max-w-2xl leading-relaxed">
              Academia premium com rede em crescimento, metodologia própria de captação e marca que já funciona.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button href="#formulario" variant="volt" size="lg">
                Quero ser franqueado
              </Button>
              <Button href="#modelo" variant="ghost" size="lg">
                Conhecer o modelo
              </Button>
            </div>
          </Reveal>
        </div>
      </Section>

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
        <SectionHeader label="Por que a LoudFit" title="O que está no modelo" />
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ativas.map((u) => (
              <UnitCard key={u.id} unit={u} />
            ))}
          </div>
        </Section>
      )}

      {/* Números — placeholder, preencher com dados reais */}
      <Section bg="black">
        <SectionHeader label="O investimento" title="Números do modelo" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <tbody>
              {[
                ['Taxa de franquia', '[preencher]'],
                ['Investimento total estimado', '[preencher]'],
                ['Royalties mensais', '[preencher]'],
                ['Área mínima ideal', '[preencher] m²'],
                ['Prazo médio de payback*', '[preencher]'],
                ['Lucratividade estimada*', '[preencher]'],
              ].map(([label, value]) => (
                <tr key={label} className="border-b border-lf-line">
                  <td className="py-4 text-lf-muted">{label}</td>
                  <td className="py-4 text-lf-volt font-black text-right">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-xs text-lf-muted border-l-2 border-lf-line pl-4">
          * Os números são estimativas e não representam garantia de resultado. A rentabilidade depende de gestão,
          ponto e mercado. Consulte o COF e a Lei de Franquias antes de assinar qualquer contrato.
        </p>
      </Section>

      {/* Aceleração LoudFit */}
      <Section bg="graphite">
        <SectionHeader label="Diferencial exclusivo" title="Aceleração LoudFit" subtitle="Sua academia não abre vazia." />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { fase: 'Antes da inauguração', desc: 'Captação de pré-alunos, lista de espera e ações de lançamento da praça antes de abrir a porta.' },
            { fase: 'Dia da inauguração', desc: 'Protocolo de abertura, presença do time LoudFit, cobertura de redes e primeiros alunos já no sistema.' },
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
