import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parse, serialize, serializeOuter } from 'parse5';
import { htmlFiles, nodes, attr, text } from './finalize-build.mjs';
import { site } from '../site.config.mjs';
if (site.base !== '/') throw new Error('Build with DEPLOY_TARGET=hosting first.');
const out = 'wordpress/build/cyl-neumaticos';
await fs.mkdir(`${out}/pages`, { recursive: true });
const prior = {};
for (const file of await fs.readdir(`${out}/pages`)) {
 if (!file.endsWith('.json')) continue;
 const old=JSON.parse(await fs.readFile(`${out}/pages/${file}`,'utf8'));
 prior[old.slug]=createHash('sha256').update('<!-- wp:html -->'+old.content+'<!-- /wp:html -->').digest('hex');
}
await fs.writeFile(`${out}/previous-content.json`,JSON.stringify(prior));
await fs.cp('wordpress/theme', out, { recursive: true });
const prefix = '/wp-content/themes/cyl-neumaticos/assets/';
// CSS loads fonts from /_astro/. Keep preloads at that same URL so the
// browser reuses one request instead of fetching a second copy from the theme.
const asset = value => value.replace(/\/_astro\/(?![^/"'\s<>]+\.(?:woff2?|otf|ttf)\b)/g, `${prefix}_astro/`).replaceAll('/optimized/', `${prefix}optimized/`).replaceAll('/images/', `${prefix}images/`);
const manifest = [];
for (const file of await htmlFiles('dist')) {
 const all = nodes(parse(await fs.readFile(file, 'utf8'))), head = all.find(n => n.tagName === 'head'), body = all.find(n => n.tagName === 'body');
 const main = body.childNodes.find(n => n.tagName === 'main');
 if (!main) throw new Error(`No main in ${file}`);
 const slug = path.relative('dist', file).replaceAll('\\', '/').replace(/\/?index\.html$/, '').replace(/\.html$/, '') || 'inicio';
 const title = text(all.find(n => n.tagName === 'title'));
 head.childNodes = head.childNodes.filter(n => !(n.tagName === 'meta' && attr(n, 'http-equiv') === 'Content-Security-Policy'));
 const index = body.childNodes.indexOf(main), outer = serializeOuter(main);
 const data = {slug, title, heading:text(all.find(n => n.tagName === 'h1')).replace(/\s+/g, ' ').trim(), head:asset(serialize(head)), before:asset(body.childNodes.slice(0,index).map(serializeOuter).join('') + outer.slice(0,outer.indexOf('>')+1)), content:asset(serialize(main)), after:asset('</main>'+body.childNodes.slice(index+1).map(serializeOuter).join(''))};
 data.bodyClass = attr(body, 'class') || '';
 await fs.writeFile(`${out}/pages/${slug}.json`, JSON.stringify(data));
 if (slug !== '404') manifest.push({slug,title:data.heading||title});
}
await fs.writeFile(`${out}/manifest.json`, JSON.stringify(manifest));
for (const folder of ['_astro','optimized','images']) await fs.cp(`dist/${folder}`, `${out}/assets/${folder}`, {recursive:true});
await fs.mkdir('wordpress/build/root/optimized', {recursive:true});
await fs.cp('dist/models','wordpress/build/root/models',{recursive:true});
// Compiled @font-face URLs are absolute, even inside the theme stylesheet.
await fs.mkdir('wordpress/build/root/_astro', {recursive:true});
for (const name of await fs.readdir('dist/_astro')) if (/\.(woff2?|otf|ttf)$/i.test(name))
  await fs.copyFile(`dist/_astro/${name}`, `wordpress/build/root/_astro/${name}`);
await fs.mkdir('wordpress/build/mu-plugins', {recursive:true});
await fs.cp('wordpress/mu-plugins','wordpress/build/mu-plugins',{recursive:true});
await fs.copyFile('src/data/survey.json','wordpress/build/mu-plugins/cyl-encuestas/survey.json');
for(const name of await fs.readdir('dist/optimized')) if(name.endsWith('.glb')) await fs.copyFile(`dist/optimized/${name}`,`wordpress/build/root/optimized/${name}`);
for (const name of ['favicon.svg','llms.txt','cyl-reading.css']) {try {await fs.copyFile(`dist/${name}`,`wordpress/build/root/${name}`);} catch(e) {if(e.code!=='ENOENT')throw e;}}
await fs.writeFile('wordpress/build/root/llms.txt',(await fs.readFile('dist/llms.txt','utf8')).replaceAll('/sitemap.xml','/wp-sitemap.xml'));
console.log(`WordPress theme prepared: ${manifest.length} pages + 404.`);
