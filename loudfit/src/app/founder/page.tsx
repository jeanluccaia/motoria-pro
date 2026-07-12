import { FounderHeader } from '@/components/founder/FounderHeader'
import { FounderFooter } from '@/components/founder/FounderFooter'
import { FounderPage } from '@/components/founder/FounderPage'

export default function Page() {
  return (
    <>
      <FounderHeader />
      <main className="bg-[#0A0A0A]">
        <FounderPage />
      </main>
      <FounderFooter />
    </>
  )
}
