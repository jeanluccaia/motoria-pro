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
    <footer className="bg-lf-graphite border-t border-lf-line">
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 py-12 lg:py-16">

        {/* Grid principal */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">

          {/* Coluna de marca */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" aria-label="LoudFit Home">
              <Image
                src="/assets/images/loudfit-logo-official-lockup-yellow.png"
                alt="LoudFit"
                width={148}
                height={42}
                className="h-auto w-[148px] object-contain"
              />
            </Link>
            <p className="mt-3 max-w-[28ch] text-sm leading-[1.6] text-lf-muted">
              O melhor ainda está por vir.
            </p>

            {/* Redes sociais */}
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://instagram.com/loudfit"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram LoudFit"
                className="flex h-8 w-8 items-center justify-center border border-lf-line text-lf-muted transition-colors hover:border-lf-volt hover:text-lf-volt"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://wa.me/5519988291946"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp LoudFit"
                className="flex h-8 w-8 items-center justify-center border border-lf-line text-lf-muted transition-colors hover:border-lf-volt hover:text-lf-volt"
              >
                <WhatsAppIcon />
              </a>
            </div>
          </div>

          {/* Links de navegação */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-lf-muted/50">
                {group}
              </p>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-lf-text/70 transition-colors hover:text-lf-text"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divisor */}
        <div className="mt-12 border-t border-lf-line pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

            {/* Dados legais */}
            <div className="text-xs leading-[1.7] text-lf-muted/50">
              <p className="font-bold text-lf-muted/70">LOUD FRANQUEADORA LTDA</p>
              <p>CNPJ: 45.519.405/0001-79</p>
              <p>Rua Antonio Bento, 347 - Vila Industrial</p>
              <p>Campinas/SP - CEP 13035-560</p>
              <p>
                E-mail:{' '}
                <a href="mailto:vilaindustrial@loudfit.com.br" className="hover:text-lf-muted transition-colors">
                  vilaindustrial@loudfit.com.br
                </a>
              </p>
              <p>
                Telefone:{' '}
                <a href="tel:+5519988291946" className="hover:text-lf-muted transition-colors">
                  (19) 98829-1946
                </a>
              </p>
            </div>

            {/* Copyright */}
            <p className="shrink-0 text-xs text-lf-muted/40">
              © {new Date().getFullYear()} LoudFit — Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  )
}
