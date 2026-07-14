import type { Metadata } from 'next'
import { Section } from '@/components/ui/Section'
import { PrivacyReopenButton } from '@/components/analytics/PrivacyReopenButton'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Como a Loud Fit trata dados pessoais, cookies e publicidade em conformidade com a LGPD.',
  alternates: { canonical: '/politica-de-privacidade' },
  openGraph: {
    title: 'Política de Privacidade | Loud Fit',
    description:
      'Como a Loud Fit trata dados pessoais, cookies e publicidade em conformidade com a LGPD.',
    url: '/politica-de-privacidade',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Política de Privacidade | Loud Fit',
    description:
      'Como a Loud Fit trata dados pessoais, cookies e publicidade em conformidade com a LGPD.',
    images: ['/opengraph-image'],
  },
}

export default function PrivacidadePage() {
  return (
    <div className="pt-16">
      <Section bg="black">
        <div className="max-w-3xl">
          <h1 className="mb-8 text-4xl font-black uppercase text-lf-text">
            Política de Privacidade
          </h1>

          <p className="mb-6 text-sm leading-relaxed text-lf-muted">
            Esta política explica, de forma direta, como a Loud Fit trata dados pessoais,
            cookies e ferramentas de análise nos nossos canais digitais. Foi escrita em
            linguagem simples e vale para todos os visitantes do site.
          </p>

          <h2 className="mt-10 mb-3 text-2xl font-black uppercase text-lf-text">
            Dados que coletamos
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-lf-muted">
            Coletamos dois tipos de informação: dados que você mesmo nos fornece (nome,
            WhatsApp, e-mail, unidade de interesse) quando preenche um formulário de
            matrícula, campanha ou franquia; e dados técnicos de navegação (páginas
            visitadas, dispositivo, origem do tráfego) capturados por ferramentas de análise
            e publicidade quando você autoriza.
          </p>

          <h2 className="mt-10 mb-3 text-2xl font-black uppercase text-lf-text">
            Cookies e categorias
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-lf-muted">
            Usamos três categorias de cookies:
          </p>
          <ul className="mb-4 flex flex-col gap-2 text-sm leading-relaxed text-lf-muted">
            <li>
              <strong className="text-lf-text">Essenciais.</strong> Necessários para o site
              funcionar (por exemplo, lembrar sua preferência de cookies). Sempre ativos.
            </li>
            <li>
              <strong className="text-lf-text">Análise.</strong> Google Analytics 4. Ajuda
              a entender quais páginas são mais visitadas e onde o site pode melhorar.
              Carregado apenas se você autorizar.
            </li>
            <li>
              <strong className="text-lf-text">Marketing.</strong> Meta Pixel e Google Ads.
              Permitem mostrar anúncios da Loud Fit em outros sites e medir a efetividade
              das campanhas. Carregado apenas se você autorizar.
            </li>
          </ul>

          <h2 className="mt-10 mb-3 text-2xl font-black uppercase text-lf-text">
            Formulários
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-lf-muted">
            Os dados enviados em formulários vão para a equipe da Loud Fit responsável pelo
            atendimento (matrícula, campanha ou franquia) e não são compartilhados com
            plataformas de publicidade. Os eventos de conversão enviados ao Google e à Meta
            informam apenas que um lead foi gerado, sem incluir nome, telefone, e-mail ou
            outros dados pessoais.
          </p>

          <h2 className="mt-10 mb-3 text-2xl font-black uppercase text-lf-text">
            Compartilhamento técnico
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-lf-muted">
            Quando você autoriza análise ou marketing, dados anônimos de navegação são
            enviados para Google e Meta para viabilizar essas categorias. Nenhum dado
            pessoal identificável é enviado por essa via.
          </p>

          <h2 className="mt-10 mb-3 text-2xl font-black uppercase text-lf-text">
            Alteração de consentimento
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-lf-muted">
            Você pode revisar ou alterar sua escolha a qualquer momento clicando no botão
            abaixo. A preferência atualizada passa a valer nas próximas navegações.
          </p>
          <PrivacyReopenButton />

          <h2 className="mt-10 mb-3 text-2xl font-black uppercase text-lf-text">
            Contato
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-lf-muted">
            Dúvidas sobre esta política ou sobre o tratamento dos seus dados podem ser
            enviadas para <a href="mailto:contato@loudfit.com.br" className="text-lf-volt underline underline-offset-4">contato@loudfit.com.br</a>.
          </p>

          <p className="mt-10 text-xs text-lf-muted/60">
            Última atualização: 14 de julho de 2026.
          </p>
        </div>
      </Section>
    </div>
  )
}
