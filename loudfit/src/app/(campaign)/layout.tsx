import { Anton, Archivo } from 'next/font/google'

const campaignDisplay = Anton({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-founder-display',
})

const campaignBody = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-founder-body',
})

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${campaignDisplay.variable} ${campaignBody.variable} founder-scope`}
      style={{ fontFamily: 'var(--font-founder-body), Archivo, system-ui, sans-serif' }}
    >
      {children}
    </div>
  )
}
