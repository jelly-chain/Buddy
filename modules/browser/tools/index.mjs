// browser tools — puppeteer scrape, screenshot, eval
// Lazy-loads puppeteer only when invoked
import { join } from 'node:path';
import { tmpdir } from 'node:os';

let puppeteer = null;
async function getPuppeteer() {
  if (puppeteer) return puppeteer;
  try {
    puppeteer = (await import('puppeteer')).default;
    return puppeteer;
  } catch {
    return null;
  }
}

async function withBrowser(fn) {
  const p = await getPuppeteer();
  if (!p) return { ok: false, error: 'puppeteer not installed — run: npm i puppeteer' };
  const browser = await p.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const res = await fn(browser);
    return res;
  } finally {
    await browser.close();
  }
}

export async function scrape({ url, selector = 'body', waitMs = 1000 } = {}) {
  if (!url) return { ok: false, error: 'url required' };
  return await withBrowser(async (browser) => {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    if (waitMs) await new Promise(r => setTimeout(r, waitMs));
    const text = await page.$eval(selector, el => el.innerText).catch(() => '');
    const title = await page.title();
    return { ok: true, url, title, selector, length: text.length, text: text.slice(0, 20000) };
  });
}

export async function screenshot({ url, path = join(tmpdir(), `shot-${Date.now()}.png`), fullPage = true } = {}) {
  if (!url) return { ok: false, error: 'url required' };
  return await withBrowser(async (browser) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path, fullPage });
    return { ok: true, url, path };
  });
}

export async function html({ url } = {}) {
  if (!url) return { ok: false, error: 'url required' };
  return await withBrowser(async (browser) => {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const content = await page.content();
    return { ok: true, url, length: content.length, html: content.slice(0, 100000) };
  });
}

export async function links({ url } = {}) {
  if (!url) return { ok: false, error: 'url required' };
  return await withBrowser(async (browser) => {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const list = await page.$$eval('a', els => els.map(a => ({ href: a.href, text: a.innerText.trim() })).filter(l => l.href));
    return { ok: true, url, count: list.length, links: list.slice(0, 200) };
  });
}

export async function perf({ url } = {}) {
  if (!url) return { ok: false, error: 'url required' };
  return await withBrowser(async (browser) => {
    const page = await browser.newPage();
    const start = Date.now();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const loadMs = Date.now() - start;
    const metrics = await page.metrics();
    return { ok: true, url, loadMs, metrics };
  });
}
