import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const presentationDir = path.join(rootDir, "apresentacao");
const sourceHtml = path.join(presentationDir, "loudfit-2.0.html");
const outputPdf = path.join(presentationDir, "loudfit-2.0.pdf");
const tempDir = path.join(presentationDir, ".pdf-export-tmp");
const tempHtml = path.join(tempDir, "pdf-pages.html");

const width = 1920;
const height = 1080;
const slideCount = 6;

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

function buildPdfHtml(slideImages) {
  const pages = slideImages
    .map((image) => `<section class="page"><img src="${image}" alt=""></section>`)
    .join("\n");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>LoudFit 2.0 PDF Export</title>
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

async function main() {
  if (!existsSync(sourceHtml)) {
    throw new Error(`Arquivo HTML não encontrado: ${sourceHtml}`);
  }

  await rm(tempDir, { recursive: true, force: true });

  const executablePath = findChromeExecutable();
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: [
      "--allow-file-access-from-files",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
  });

  try {
    const sourceUrl = pathToFileURL(sourceHtml).href;
    const renderPage = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });

    await renderPage.emulateMedia({ media: "screen" });
    const slideImages = [];

    for (let index = 1; index <= slideCount; index += 1) {
      await renderPage.goto(`${sourceUrl}#slide-${index}`, { waitUntil: "load" });
      await renderPage.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
          }

          .nav,
          .mobile-nav,
          .slide-nav {
            display: none !important;
          }
        `,
      });
      await waitForSlideAssets(renderPage);
      await renderPage.waitForTimeout(250);

      const activeSlide = await renderPage.evaluate(() => document.querySelector(".slide.is-active")?.id);
      if (activeSlide !== `slide-${index}`) {
        throw new Error(`Slide ativo incorreto: esperado slide-${index}, recebido ${activeSlide || "nenhum"}`);
      }

      const screenshot = await renderPage.screenshot({
        type: "png",
        fullPage: false,
        animations: "disabled",
      });

      slideImages.push(`data:image/png;base64,${screenshot.toString("base64")}`);
      console.log(`Slide ${index}/${slideCount} renderizado.`);
    }

    await mkdir(tempDir, { recursive: true });
    await writeFile(tempHtml, buildPdfHtml(slideImages), "utf8");

    const pdfPage = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });

    await pdfPage.goto(pathToFileURL(tempHtml).href, { waitUntil: "load" });
    await pdfPage.waitForFunction(() => Array.from(document.images).every((image) => image.complete));

    await pdfPage.pdf({
      path: outputPdf,
      width: `${width}px`,
      height: `${height}px`,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    const pages = await countPdfPages(outputPdf);
    if (pages !== slideCount) {
      throw new Error(`PDF inválido: esperado ${slideCount} páginas, gerado com ${pages}.`);
    }

    console.log(`PDF exportado com ${pages} páginas: ${outputPdf}`);
  } finally {
    await browser.close();
    await rm(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
