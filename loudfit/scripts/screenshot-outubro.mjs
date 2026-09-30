import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const OUT_DIR = '.screenshots'
mkdirSync(OUT_DIR, { recursive: true })

const BASE = process.env.BASE || 'http://localhost:3000'

const targets = [
  { path: '/', label: 'home' },
  { path: '/unidades/ipiranga', label: 'ipiranga' },
  { path: '/unidades/pinheiros', label: 'pinheiros' },
]

const viewports = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1280', width: 1280, height: 800 },
  { name: '1024', width: 1024, height: 768 },
  { name: '768', width: 768, height: 1024 },
  { name: '390', width: 390, height: 844 },
  { name: '360', width: 360, height: 780 },
]

const browser = await chromium.launch()

for (const target of targets) {
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
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
    try {
      await page.goto(BASE + target.path, { waitUntil: 'networkidle', timeout: 30000 })
    } catch (err) {
      console.warn('goto slow, retrying with load', target.path, vp.name)
      await page.goto(BASE + target.path, { waitUntil: 'load', timeout: 30000 })
    }
    // Remove consent banner if any
    await page.evaluate(() => {
      document.querySelectorAll('[role="dialog"], [class*="consent" i]').forEach((el) => el.remove())
    })
    // Reveal any framer-motion elements
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let y = 0
        const step = 400
        const timer = setInterval(() => {
          window.scrollTo(0, y)
          y += step
          if (y >= document.body.scrollHeight + 200) {
            clearInterval(timer)
            setTimeout(resolve, 300)
          }
        }, 60)
      })
    })
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
    await page.waitForTimeout(400)
    const out = join(OUT_DIR, `outubro-${target.label}-${vp.name}.png`)
    await page.screenshot({ path: out, fullPage: true })
    console.log('saved', out)
    await context.close()
  }
}

await browser.close()
