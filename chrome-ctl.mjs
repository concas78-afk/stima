// Controllo di Chrome via CDP (Chrome deve essere avviato con --remote-debugging-port=9222)
// Uso:
//   node chrome-ctl.mjs open <url>
//   node chrome-ctl.mjs url | title | text
//   node chrome-ctl.mjs click "<selettore>"
//   node chrome-ctl.mjs fill "<selettore>" "<testo>"
//   node chrome-ctl.mjs eval "<javascript>"
//   node chrome-ctl.mjs shot <file.png> [full]
//   node chrome-ctl.mjs tabs
import { chromium } from 'playwright-core';

const [, , cmd, ...args] = process.argv;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0] || (await browser.newContext());
  const pages = context.pages();
  const page = pages[0] || (await context.newPage());

  switch (cmd) {
    case 'open': {
      await page.goto(args[0], { waitUntil: 'domcontentloaded', timeout: 60000 });
      await sleep(1500);
      console.log('URL:', page.url());
      console.log('Titolo:', await page.title());
      break;
    }
    case 'url':
      console.log(page.url());
      break;
    case 'title':
      console.log(await page.title());
      break;
    case 'text': {
      const t = await page.innerText('body').catch(() => '');
      console.log(t.slice(0, 6000));
      break;
    }
    case 'html': {
      const h = await page.content();
      console.log(h.slice(0, 8000));
      break;
    }
    case 'click':
      await page.click(args[0], { timeout: 20000 });
      await sleep(800);
      console.log('Click su:', args[0], '→', page.url());
      break;
    case 'fill':
      await page.fill(args[0], args[1] || '');
      console.log('Compilato:', args[0]);
      break;
    case 'press':
      await page.keyboard.press(args[0]);
      console.log('Tasto:', args[0]);
      break;
    case 'eval': {
      const r = await page.evaluate(args[0]);
      console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 2));
      break;
    }
    case 'shot':
      await page.screenshot({ path: args[0], fullPage: args[1] === 'full' });
      console.log('Screenshot salvato:', args[0]);
      break;
    case 'tabs':
      pages.forEach((p, i) => console.log(i, p.url()));
      break;
    default:
      console.log('Comandi: open <url> | url | title | text | html | click "<sel>" | fill "<sel>" "<testo>" | press <tasto> | eval "<js>" | shot <file> [full] | tabs');
  }
  process.exit(0);
}

main().catch((e) => {
  console.error('ERRORE:', e.message);
  process.exit(1);
});
