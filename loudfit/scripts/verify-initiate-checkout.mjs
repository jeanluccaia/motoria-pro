/**
 * Validação em produção do disparo InitiateCheckout.
 * Fluxo: janela nova → https://loudfit.com.br/matricula/ipiranga →
 * aceita cookies → clica em "Abrir checkout em nova aba" → captura
 * request para facebook.com/tr contendo ev=InitiateCheckout do pixel
 * 1358787552249382.
 */
import { chromium } from 'playwright'

const PIXEL_ID = '1358787552249382'
const TARGET_URL = 'https://loudfit.com.br/matricula/ipiranga'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  locale: 'pt-BR',
})
const page = await context.newPage()

const metaRequests = []
page.on('request', (req) => {
  const url = req.url()
  if (url.includes('facebook.com/tr') || url.includes('facebook.net/tr')) {
    metaRequests.push({ url, method: req.method() })
  }
})

const consoleLines = []
page.on('console', (msg) => {
  const text = msg.text()
  if (text.startsWith('[LF CHECKOUT]')) consoleLines.push(text)
})

console.log('→ navegando para', TARGET_URL)
await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' })

console.log('→ aceitando cookies')
const accept = page.getByRole('button', { name: /aceitar/i }).first()
await accept.waitFor({ state: 'visible', timeout: 10_000 })
await accept.click()

// aguarda fbevents carregar (PageView deve chegar)
await page.waitForFunction(() => typeof window.fbq === 'function', { timeout: 15_000 })
await page.waitForTimeout(1500)

console.log('→ clicando em "Abrir checkout em nova aba"')
const link = page.getByRole('link', { name: /abrir checkout em nova aba/i }).first()
await link.waitFor({ state: 'visible' })
await link.click({ modifiers: ['Control'] }) // Ctrl+click evita popup

await page.waitForTimeout(4000)

console.log('\n=== [LF CHECKOUT] logs ===')
for (const line of consoleLines) console.log('  ' + line)

console.log('\n=== requests para pixel Meta ===')
const initiate = metaRequests.filter((r) => {
  const u = new URL(r.url)
  const ev = u.searchParams.get('ev')
  const id = u.searchParams.get('id')
  return ev === 'InitiateCheckout' && id === PIXEL_ID
})

for (const r of metaRequests) {
  const u = new URL(r.url)
  console.log('  ', r.method, u.searchParams.get('ev'), 'id=' + u.searchParams.get('id'), 'value=' + u.searchParams.get('cd[value]'), 'currency=' + u.searchParams.get('cd[currency]'))
}

if (initiate.length === 0) {
  console.error('\nFALHA: nenhum request InitiateCheckout capturado.')
  await browser.close()
  process.exit(1)
}

console.log('\nSUCESSO — request InitiateCheckout recebido:')
for (const r of initiate) console.log('  ' + r.url)

await browser.close()
process.exit(0)
