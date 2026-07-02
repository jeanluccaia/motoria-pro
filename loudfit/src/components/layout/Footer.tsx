import Link from 'next/link'

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
            <span className="font-black text-2xl tracking-tighter text-lf-volt uppercase">LoudFit</span>
            <p className="mt-3 text-sm text-lf-muted leading-relaxed">
              A rede que treina alto.
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

        <div className="mt-12 pt-8 border-t border-lf-line flex flex-col sm:flex-row justify-between gap-4 text-xs text-lf-muted">
          <span>© {new Date().getFullYear()} LoudFit. Todos os direitos reservados.</span>
          <span>CNPJ: [00.000.000/0001-00]</span>
        </div>
      </div>
    </footer>
  )
}
