import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const presentationDir = path.join(rootDir, "apresentacao");
const sourceHtml = path.join(presentationDir, "loudfit-2.0.html");
const tempDir = path.join(presentationDir, ".pdf-export-tmp");
const slideCount = 6;

const exportsToCreate = [
  {
    name: "mobile",
    outputPdf: path.join(presentationDir, "loudfit-2.0.pdf"),
    title: "LoudFit 2.0 Mobile PDF",
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 3,
    pageSize: { width: 1080, height: 2340 },
  },
  {
    name: "16x9",
    outputPdf: path.join(presentationDir, "loudfit-2.0-16x9.pdf"),
    title: "LoudFit 2.0 16x9 PDF",
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    pageSize: { width: 1920, height: 1080 },
  },
];

function findChromeExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
    path.join(process.env.PROGRAMFILES || "", "Microsoft\\Edge\\Application\\msedge.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "", "Microsoft\\Edge\\Application\\msedge.exe"),
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate));
}

async function waitForSlideAssets(page) {
  await page.waitForFunction(() => {
    const images = Array.from(document.images);
    return images.length > 0 && images.every((image) => image.complete && image.naturalWidth > 0);
  }, null, { timeout: 20000 });

  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  });
}

async function countPdfPages(pdfPath) {
  const buffer = await readFile(pdfPath);
  const text = buffer.toString("latin1");
  const matches = text.match(/\/Type\s*\/Page\b/g);
  return matches?.length || 0;
}

function buildPdfHtml(slideImages, config) {
  const { width, height } = config.pageSize;
  const pages = slideImages
    .map((image) => `<section class="page"><img src="${image}" alt=""></section>`)
    .join("\n");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${config.title}</title>
  <style>
    @page {
      size: ${width}px ${height}px;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      width: ${width}px;
      margin: 0;
      padding: 0;
      background: #0A0A0A;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: ${width}px;
      height: ${height}px;
      margin: 0;
      padding: 0;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
      background: #0A0A0A;
    }

    .page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    img {
      display: block;
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
${pages}
</body>
</html>`;
}

async function renderSlideImages(browser, config, sourceUrl) {
  const page = await browser.newPage({
    viewport: config.viewport,
    deviceScaleFactor: config.deviceScaleFactor,
  });

  await page.emulateMedia({ media: "screen" });
  const slideImages = [];

  for (let index = 1; index <= slideCount; index += 1) {
    await page.goto(`${sourceUrl}#slide-${index}`, { waitUntil: "load" });
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
        }

        .progress,
        .nav,
        .mobile-nav,
        .slide-nav {
          display: none !important;
        }
      `,
    });
    await waitForSlideAssets(page);
    await page.waitForTimeout(250);

    const activeSlide = await page.evaluate(() => document.querySelector(".slide.is-active")?.id);
    if (activeSlide !== `slide-${index}`) {
      throw new Error(`Wrong active slide: expected slide-${index}, got ${activeSlide || "none"}.`);
    }

    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false,
      animations: "disabled",
    });

    slideImages.push(`data:image/png;base64,${screenshot.toString("base64")}`);
    console.log(`${config.name}: slide ${index}/${slideCount} rendered.`);
  }

  await page.close();
  return slideImages;
}

async function createPdf(browser, config, slideImages) {
  const htmlPath = path.join(tempDir, `${config.name}.html`);
  await writeFile(htmlPath, buildPdfHtml(slideImages, config), "utf8");

  const page = await browser.newPage({
    viewport: config.pageSize,
    deviceScaleFactor: 1,
  });

  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));

  await page.pdf({
    path: config.outputPdf,
    width: `${config.pageSize.width}px`,
    height: `${config.pageSize.height}px`,
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await page.close();

  const pages = await countPdfPages(config.outputPdf);
  if (pages !== slideCount) {
    throw new Error(`${config.name}: expected ${slideCount} pages, got ${pages}.`);
  }

  console.log(`${config.name}: exported ${pages} pages to ${config.outputPdf}`);
}

async function main() {
  if (!existsSync(sourceHtml)) {
    throw new Error(`HTML file not found: ${sourceHtml}`);
  }

  await rm(tempDir, { recursive: true, force: true });
  await mkdir(tempDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: findChromeExecutable(),
    args: [
      "--allow-file-access-from-files",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
  });

  try {
    const sourceUrl = pathToFileURL(sourceHtml).href;

    for (const config of exportsToCreate) {
      const slideImages = await renderSlideImages(browser, config, sourceUrl);
      await createPdf(browser, config, slideImages);
    }
  } finally {
    await browser.close();
    await rm(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
