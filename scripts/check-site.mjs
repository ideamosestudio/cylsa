import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parse } from 'parse5';
import { htmlFiles, nodes, attr, text } from './finalize-build.mjs';
import { site, siteUrl } from '../site.config.mjs';

const failures = [], titles = new Set(), canonicals = new Set();
const exists = p => fs.access(p).then(() => true, () => false);
const files = await htmlFiles('dist');
let links = 0, images = 0, schemas = 0;
const sitemap = await fs.readFile('dist/sitemap.xml', 'utf8');
for (const file of files) {
  const elements = nodes(parse(await fs.readFile(file, 'utf8')));
  const require = (ok, message) => { if (!ok) failures.push(`${file}: ${message}`); };
  const meta = name => attr(elements.find(n => n.tagName === 'meta' && attr(n, 'name') === name) || {}, 'content');
  const title = elements.find(n => n.tagName === 'title');
  require(title && text(title).length > 5, 'missing title');
  require(!titles.has(text(title || {})), 'duplicate title'); titles.add(text(title || {}));
  require(meta('description')?.length > 30, 'missing/empty description');
  require(elements.filter(n => n.tagName === 'h1').length === 1, 'expected exactly one h1');
  require(elements.some(n => n.tagName === 'html' && attr(n, 'lang') === 'es'), 'missing Spanish language');
  require(!elements.some(n => n.tagName === 'html' && (attr(n, 'class') || '').split(/\s+/).includes('is-loading')), 'page must not lock scrolling while WebGL loads');
  require(!elements.some(n => n.attrs?.some(a => a.name === 'data-site-loader')), 'blocking loader must not gate access to the site');
  const canonical = attr(elements.find(n => n.tagName === 'link' && attr(n, 'rel') === 'canonical') || {}, 'href');
  require(canonical?.startsWith(siteUrl) && !canonical?.includes('?'), 'invalid canonical');
  require(!canonicals.has(canonical), 'duplicate canonical'); canonicals.add(canonical);
  if (!meta('robots')?.includes('noindex')) require(sitemap.includes(`<loc>${canonical}</loc>`), 'page missing from sitemap');
  require(elements.some(n => attr(n, 'property') === 'og:image'), 'missing social image');
  const policy = attr(elements.find(n => attr(n, 'http-equiv') === 'Content-Security-Policy') || {}, 'content') || '';
  require(policy.includes("object-src 'none'") && policy.includes("base-uri 'none'") && policy.includes("form-action 'none'"), 'missing CSP controls');
  require(!policy.split('script-src ')[1]?.split(';')[0].includes("'unsafe-inline'"), 'unsafe script policy');
  for (const el of elements) {
    require(!el.attrs?.some(a => /^on[a-z]/i.test(a.name)), 'inline event handler');
    if (el.tagName === 'form') require(!attr(el,'action'), 'form must not send personal data in URL or to an unreviewed endpoint');
    if (el.tagName === 'script' && !attr(el, 'src')) {
      const body = text(el);
      require(policy.includes(createHash('sha256').update(body).digest('base64')), 'inline script is not CSP hashed');
      if (attr(el, 'type') === 'application/ld+json') {
        try {
          const data = JSON.parse(body); schemas++;
          require(data['@context'] === 'https://schema.org' && data['@graph']?.length > 0, 'invalid schema graph');
          for (const item of data['@graph'] || []) if (item['@type'] === 'Product') require(item.name && item.image && item.description && item.brand?.name && !item.offers && !item.aggregateRating, 'incomplete product or invented offers/ratings');
        } catch { require(false, 'invalid JSON-LD'); }
      }
    }
    if (el.tagName === 'img') {
      images++;
      require(attr(el,'alt') !== undefined, 'image without alt');
      require(Number(attr(el,'width')) > 0 && Number(attr(el,'height')) > 0, 'image without dimensions');
      require(attr(el,'src')?.includes('/optimized/') || /\.svg$/.test(attr(el,'src') || ''), 'unoptimized raster image');
      require(!!attr(el,'srcset'), 'image without responsive variants');
    }
    const refs = [attr(el,'href'), attr(el,'src'), ...(attr(el,'srcset') || '').split(',').map(s => s.trim().split(/\s/)[0])].filter(Boolean);
    for (const ref of refs) {
      require(!/^javascript:|^http:/i.test(ref), `unsafe URL ${ref}`);
      let url;
      try { url = new URL(ref, canonical || siteUrl); } catch { require(false, `invalid URL ${ref}`); continue; }
      if (url.origin !== site.origin) continue;
      require(url.pathname.startsWith(site.base), `URL escapes Pages base ${ref}`);
      if (!url.pathname.startsWith(site.base)) continue;
      const target = path.join('dist', decodeURIComponent(url.pathname.slice(site.base.length)));
      links++;
      require(await exists(target) || await exists(path.join(target, 'index.html')) || (meta('robots')?.includes('noindex') && await exists(`${target.replace(/[\\/]$/, '')}.html`)), `missing destination ${url.pathname}`);
    }
  }
}
const llms = await fs.readFile('dist/llms.txt', 'utf8');
if (!llms.includes(siteUrl) || !llms.includes('stock')) failures.push('llms.txt missing factual catalogue guidance');
const model = JSON.parse(await fs.readFile('src/generated/model.json', 'utf8'));
if ((await fs.stat(path.join('dist', model.src))).size > 750000) failures.push('3D model exceeds 750 KB budget');
console.log(JSON.stringify({ pages: files.length, links, images, schemas, failures }, null, 2));
if (failures.length) process.exitCode = 1;
