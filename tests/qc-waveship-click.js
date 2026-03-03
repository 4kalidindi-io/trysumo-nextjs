const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const outDir = 'tests/artifacts';
  try { fs.mkdirSync(outDir, { recursive: true }); } catch (e) {}

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleMsgs = [];
  page.on('console', (msg) => consoleMsgs.push(`${msg.type()}: ${msg.text()}`));
  page.on('pageerror', (err) => consoleMsgs.push(`pageerror: ${err.message}`));

  const url = 'http://localhost:3000/games/waveship/index.html';
  console.log('Opening', url);
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 15000 });
  } catch (e) {
    console.error('Navigation failed:', e.message);
  }

  // try clicking the big play button if present
  try {
    await page.click('#play-button', { timeout: 3000 });
    consoleMsgs.push('info: clicked play button');
  } catch (e) {
    consoleMsgs.push('info: play button not found or click failed');
  }

  await page.waitForTimeout(1000);

  const screenshotPath = `${outDir}/waveship-click.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Saved screenshot:', screenshotPath);

  const logsPath = `${outDir}/console-click.log`;
  fs.writeFileSync(logsPath, consoleMsgs.join('\n') || '(no console messages)');
  console.log('Saved console log:', logsPath);

  if (consoleMsgs.length) consoleMsgs.forEach(m => console.log(m));

  await browser.close();
  process.exit(0);
})();
