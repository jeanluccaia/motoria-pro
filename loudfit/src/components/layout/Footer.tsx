import Link from 'next/link'
import Image from 'next/image'

interface FooterLink {
  label: string
  href: string
  external?: boolean
}

const navGroups: { title: string; items: FooterLink[] }[] = [
  {
    title: 'Treine na LoudFit',
    items: [
      { label: 'Unidades', href: '/unidades' },
      { label: 'Planos', href: '/#planos' },
      { label: 'Modalidades', href: '/modalidades' },
      { label: 'Matrícula', href: '/unidades' },
    ],
  },
  {
    title: 'LoudFit',
    items: [
      { label: 'Sobre', href: '/sobre' },
      { label: 'Contato', href: '/contato' },
      { label: 'Carreiras', href: '/carreiras' },
    ],
  },
  {
    title: 'Expansão',
    items: [
      { label: 'Seja franqueado', href: '/franquias' },
      { label: 'Conheça o modelo', href: '/franquias#modelo' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Dúvidas frequentes', href: '/franquias#faq' },
      { label: 'Política de privacidade', href: '/politica-de-privacidade' },
    ],
  },
]

// Redes sociais oficiais. Só entram no footer quando existir URL confirmada.
const socials: { label: string; href: string; icon: 'instagram' | 'whatsapp' }[] = [
  {
    label: 'Instagram LoudFit',
    href: 'https://instagram.com/loudfit',
    icon: 'instagram',
  },
  {
    label: 'WhatsApp LoudFit',
    href: 'https://wa.me/5519988291946',
    icon: 'whatsapp',
  },
]

const contactInfo = {
  email: 'vilaindustrial@loudfit.com.br',
  phone: '+5519988291946',
  phoneLabel: '(19) 98829-1946',
  legalName: 'LOUD FRANQUEADORA LTDA',
  cnpj: '45.519.405/0001-79',
}

export function Footer() {
  return (
    <footer className="relative bg-lf-black border-t border-lf-line">
      {/* Traço diagonal amarelo — assinatura visual */}
      <div aria-hidden="true" className="absolute left-0 top-0 h-[3px] w-40 -skew-x-12 origin-left bg-lf-volt" />

      <div className="mx-auto w-full max-w-[1360px] px-5 py-14 sm:px-8 md:py-20 lg:px-12">

        {/* Bloco superior — marca + navegação */}
        <div className="grid gap-12 lg:grid-cols-[1.15fr_2fr] lg:gap-16">

          <div className="flex flex-col gap-6">
            <Link href="/" aria-label="LoudFit — página inicial" className="inline-flex">
              <Image
                src="/assets/images/loudfit-logo-official-lockup-yellow.png"
                alt="LoudFit"
                width={168}
                height={48}
                className="h-auto w-[168px] object-contain"
              />
            </Link>

            <p
              className="max-w-[24ch] font-black uppercase leading-[1.02] tracking-[-0.005em] text-lf-text"
              style={{ fontSize: 'clamp(1.6rem, 2.4vw, 2.2rem)' }}
            >
              O melhor ainda está por vir
            </p>

            <p className="max-w-[38ch] text-[14.5px] leading-[1.6] text-lf-muted">
              Rede de academias em expansão pelo interior e capital de São Paulo, com estrutura completa e aulas coletivas inclusas.
            </p>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-lf-muted/70">
                Siga a LoudFit
              </p>
              <ul className="mt-3 flex items-center gap-3">
                {socials.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="flex h-10 w-10 items-center justify-center border border-lf-line text-lf-text/85 transition-colors hover:border-lf-volt hover:text-lf-volt focus-visible:border-lf-volt focus-visible:text-lf-volt focus-visible:outline-none"
                    >
                      {social.icon === 'instagram' ? <InstagramIcon /> : <WhatsAppIcon />}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Navegação */}
          <nav aria-label="Rodapé" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-lf-volt">
                  {group.title}
                </p>
                <ul className="flex flex-col gap-3">
                  {group.items.map((item) => (
                    <li key={item.href + item.label}>
                      <Link
                        href={item.href}
                        className="text-[14px] leading-[1.4] text-lf-text/80 transition-colors hover:text-lf-text focus-visible:text-lf-text focus-visible:outline-none"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

        </div>

        {/* Bloco de contato institucional */}
        <div className="mt-14 grid gap-8 border-t border-lf-line pt-10 md:grid-cols-3 md:gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-lf-muted/70">
              Fale com a LoudFit
            </p>
            <a
              href={`mailto:${contactInfo.email}`}
              className="mt-2 block text-[14.5px] leading-[1.5] text-lf-text/85 transition-colors hover:text-lf-volt"
            >
              {contactInfo.email}
            </a>
            <a
              href={`tel:${contactInfo.phone}`}
              className="mt-1 block text-[14.5px] leading-[1.5] text-lf-text/85 transition-colors hover:text-lf-volt"
            >
              {contactInfo.phoneLabel}
            </a>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-lf-muted/70">
              Institucional
            </p>
            <p className="mt-2 text-[13px] leading-[1.55] text-lf-text/70">
              {contactInfo.legalName}<br />
              CNPJ {contactInfo.cnpj}
            </p>
          </div>

          <div className="md:text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-lf-muted/70">
              Quer abrir uma unidade
            </p>
            <Link
              href="/franquias"
              className="mt-3 inline-flex min-h-[44px] items-center gap-2 border border-lf-line px-5 py-2 text-[12px] font-black uppercase tracking-[0.14em] text-lf-text transition-colors hover:border-lf-volt hover:text-lf-volt"
            >
              Quero ser franqueado
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Rodapé legal */}
        <div className="mt-10 flex flex-col gap-3 border-t border-lf-line pt-6 text-[12px] text-lf-muted/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} LoudFit — Todos os direitos reservados</p>
          <p>Rede em expansão · SP</p>
        </div>

      </div>
    </footer>
  )
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  )
}
