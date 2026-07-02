import Link from 'next/link'
import Image from 'next/image'

const links = {
  Rede: [
    { label: 'Unidades', href: '/unidades' },
    { label: 'Modalidades', href: '/modalidades' },
    { label: 'Planos', href: '/#planos' },
  ],
  Empresa: [
    { label: 'Sobre', href: '/sobre' },
    { label: 'Carreiras', href: '/carreiras' },
    { label: 'Contato', href: '/contato' },
  ],
  Franquias: [
    { label: 'Seja franqueado', href: '/franquias' },
    { label: 'Política de privacidade', href: '/politica-de-privacidade' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-lf-graphite border-t border-lf-line mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" aria-label="LoudFit Home">
              <Image
                src="/assets/images/loudfit-logo-official-lockup-yellow.png"
                alt="LoudFit"
                width={148}
                height={42}
                className="h-auto w-[148px] object-contain"
              />
            </Link>
            <p className="mt-3 text-sm text-lf-muted leading-relaxed">
              O melhor ainda está por vir.
            </p>
          </div>

          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs uppercase tracking-widest text-lf-muted mb-4">{group}</p>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-lf-text/70 hover:text-lf-text transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-lf-line text-xs text-lf-muted">
          <span>© {new Date().getFullYear()} LoudFit — Todos os direitos reservados.</span>
        </div>
      </div>
    </footer>
  )
}
