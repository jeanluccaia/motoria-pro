import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'

export function ExpansionBanner() {
  return (
    <Section bg="graphite">
      <Reveal>
        <div className="relative overflow-hidden border border-lf-volt/20 p-10 md:p-16 text-center">
          {/* Decorative glow */}
          <div className="absolute inset-0 bg-gradient-radial from-lf-volt/5 via-transparent to-transparent pointer-events-none" />

          <p className="text-xs uppercase tracking-[0.3em] text-lf-volt mb-4">Expansão</p>
          <h2 className="text-5xl md:text-7xl font-black text-lf-text leading-none">
            A LOUDFIT ESTÁ<br />
            <span className="text-lf-volt">CRESCENDO.</span>
          </h2>
          <p className="mt-6 text-lg text-lf-muted max-w-lg mx-auto">
            Cresça junto. Seja dono de uma unidade em uma rede que funciona.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/franquias" variant="volt" size="lg">
              Quero ser franqueado
            </Button>
            <Button href="/franquias#formulario" variant="outline" size="lg">
              Falar com o time
            </Button>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}
