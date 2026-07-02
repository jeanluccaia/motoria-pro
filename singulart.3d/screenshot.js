const puppeteer = require('../node_modules/puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--allow-file-access-from-files',
      '--font-render-hinting=none'
    ]
  });

  const dir = __dirname;
  const htmlFile = 'carta_combined.html';
  const url = 'file:///' + path.join(dir, htmlFile).replace(/\\/g, '/');

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 5760, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Wait for fonts to finish loading
  await page.evaluate(() => document.fonts.ready);

  // Page 1 screenshot
  await page.screenshot({
    path: path.join(dir, 'singulart3d_p1.jpg'),
    clip: { x: 0, y: 0, width: 1080, height: 1920 },
    type: 'jpeg',
    quality: 97
  });
  console.log('OK: singulart3d_p1.jpg');

  // Page 2 screenshot
  await page.screenshot({
    path: path.join(dir, 'singulart3d_p2.jpg'),
    clip: { x: 0, y: 1920, width: 1080, height: 1920 },
    type: 'jpeg',
    quality: 97
  });
  console.log('OK: singulart3d_p2.jpg');

  // Page 3 screenshot
  await page.screenshot({
    path: path.join(dir, 'singulart3d_p3.jpg'),
    clip: { x: 0, y: 3840, width: 1080, height: 1920 },
    type: 'jpeg',
    quality: 97
  });
  console.log('OK: singulart3d_p3.jpg');

  await page.close();
  await browser.close();
  console.log('Screenshots done.');
})();
