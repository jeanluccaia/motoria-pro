import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const OUT_DIR = '.screenshots'
mkdirSync(OUT_DIR, { recursive: true })

const BASE = process.env.BASE || 'http://localhost:3000'
const PATH = '/sobre'

const viewports = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1280', width: 1280, height: 800 },
  { name: '768', width: 768, height: 1024 },
  { name: '430', width: 430, height: 932 },
  { name: '390', width: 390, height: 844 },
  { name: '360', width: 360, height: 780 },
]

const browser = await chromium.launch()

for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  })
  const page = await context.newPage()
  // Preset consent to hide the cookies banner (must match shape in src/lib/consent.ts)
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        'lf_consent_v1',
        JSON.stringify({
          essential: true,
          analytics: true,
          marketing: true,
          decidedAt: new Date().toISOString(),
        }),
      )
    } catch {}
  })
  await page.goto(BASE + PATH, { waitUntil: 'networkidle' })
  // If the banner is still there (state raced), remove it directly
  await page.evaluate(() => {
    document.querySelectorAll('[role="dialog"], [class*="consent" i]').forEach((el) => el.remove())
  })
  // Slow scroll from top to bottom so every framer-motion whileInView fires
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0
      const step = 300
      const timer = setInterval(() => {
        window.scrollTo(0, y)
        y += step
        if (y >= document.body.scrollHeight + 200) {
          clearInterval(timer)
          setTimeout(resolve, 300)
        }
      }, 80)
    })
  })
  // Force any lingering hidden framer-motion elements to become visible
  await page.evaluate(() => {
    document.querySelectorAll('*').forEach((el) => {
      const s = el.getAttribute('style') || ''
      if (s.includes('opacity: 0') || s.includes('opacity:0')) {
        el.style.opacity = '1'
        el.style.transform = 'none'
      }
    })
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(500)
  const out = join(OUT_DIR, `sobre-design-final-${vp.name}.png`)
  await page.screenshot({ path: out, fullPage: true })
  console.log('saved', out)
  await context.close()
}

await browser.close()
