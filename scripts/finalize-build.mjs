import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parse } from 'parse5';
import { siteUrl } from '../site.config.mjs';

export async function htmlFiles(dir) {
  const result = [];
  for (const item of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) result.push(...await htmlFiles(file));
    else if (file.endsWith('.html')) result.push(file);
  }
  return result;
}
export function nodes(node, result = []) {
  if (node.tagName) result.push(node);
  for (const child of node.childNodes || []) nodes(child, result);
  return result;
}
export const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
export const text = node => (node.childNodes || []).map(c => c.value || text(c)).join('');

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('scripts/finalize-build.mjs')) {
  const urls = [];
  for (const file of await htmlFiles('dist')) {
    let html = await fs.readFile(file, 'utf8');
    const elements = nodes(parse(html));
    const hashes = elements.filter(n => n.tagName === 'script' && !attr(n, 'src')).map(n => `'sha256-${createHash('sha256').update(text(n)).digest('base64')}'`);
    // GitHub Pages does not offer custom response headers. Apply the directives
    // supported by CSP meta, before any page resources. Dynamic animation styles
    // need style-src unsafe-inline; JavaScript never needs unsafe-inline/eval.
    const policy = [
      "default-src 'self'", `script-src 'self' 'wasm-unsafe-eval' ${[...new Set(hashes)].join(' ')}`,
      "script-src-attr 'none'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:",
      "font-src 'self'", "connect-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'none'", "frame-src 'none'",
    ].join('; ');
    html = html.replace(/<meta charset="[^"]+"\s*\/?\s*>/i, m => `${m}<meta http-equiv="Content-Security-Policy" content="${policy}">`);
    await fs.writeFile(file, html);
    if (!elements.some(n => attr(n, 'name') === 'robots' && attr(n, 'content')?.includes('noindex'))) {
      const canonical = elements.find(n => n.tagName === 'link' && attr(n, 'rel') === 'canonical');
      if (canonical) urls.push(attr(canonical, 'href'));
    }
  }
  const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  await fs.writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(urls)].sort().map(url => `  <url><loc>${escape(url)}</loc></url>`).join('\n')}\n</urlset>\n`);
  await fs.writeFile('dist/robots.txt', `# A robots.txt is authoritative only at the origin root (/robots.txt).\n# On GitHub project Pages, this copy documents the intended policy.\nUser-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`);
  await fs.writeFile('dist/.nojekyll', '');
  console.log(`CSP applied to HTML; sitemap contains ${urls.length} URLs.`);
}
