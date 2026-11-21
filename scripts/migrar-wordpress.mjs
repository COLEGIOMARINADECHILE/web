// Migra el contenido del WordPress actual a archivos Markdown + imágenes locales.
// Uso: node scripts/migrar-wordpress.mjs <carpeta-con-json-de-la-api>
// La carpeta debe contener posts.json, pages.json, media1.json, media2.json y categories.json
// descargados desde https://colegiomarinadechile.cl/wp-json/wp/v2/...
import fs from 'node:fs';
import path from 'node:path';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const SRC = process.argv[2];
if (!SRC) throw new Error('Indica la carpeta con los JSON de la API de WordPress');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = 'https://colegiomarinadechile.cl';
const read = (f) => JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));

const posts = read('posts.json');
const pages = read('pages.json');
const media = [...read('media1.json'), ...read('media2.json')];
const categories = Object.fromEntries(read('categories.json').map((c) => [c.id, c.slug]));
const mediaById = Object.fromEntries(media.map((m) => [m.id, m.source_url]));

// Páginas de WordPress que no se migran (plantillas de demostración o bloques de la portada).
const OMITIR = new Set(['home-page', 'home-page-2', 'introduction']);
// Noticias que aparecen en el carrusel de la portada.
const DESTACADAS = new Set(['matricula-2027', 'dialogos-intergeneracionales']);

const descargas = new Set();

/** Convierte una URL de wp-content/uploads en ruta local /uploads/... y la agenda para descarga. */
function local(url) {
  if (!url) return url;
  const m = decodeURI(url).match(/\/wp-content\/uploads\/(.+)$/);
  if (!m) return url;
  descargas.add(url);
  return '/uploads/' + m[1];
}

/** Elige la imagen original (sin sufijo -WxH) a partir del srcset, si existe. */
function original(img) {
  const srcset = img.getAttribute?.('srcset') ?? '';
  const cands = srcset.split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean);
  const orig = cands.find((u) => !/-\d+x\d+\.[a-z]+$/i.test(u));
  return orig || img.getAttribute('src');
}

function limpiarHtml(html) {
  return html
    // bloques <style> que WordPress inserta en galerías
    .replace(/<style[\s\S]*?<\/style>/g, '')
    // vistas previas de PDF del bloque "Archivo": dejamos solo el enlace
    .replace(/<object[\s\S]*?<\/object>/g, '')
    .replace(/<a[^>]*wp-block-file__button[^>]*>[\s\S]*?<\/a>/g, '')
    // emojis que WordPress convierte en imágenes
    .replace(/<img[^>]*class="[^"]*(wp-smiley|emoji)[^"]*"[^>]*alt="([^"]*)"[^>]*>/g, '$2')
    .replace(/<img[^>]*alt="([^"]*)"[^>]*class="[^"]*(wp-smiley|emoji)[^"]*"[^>]*>/g, '$1');
}

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', emDelimiter: '*' });
td.use(gfm);
td.addRule('imagen', {
  filter: 'img',
  replacement: (_c, node) => {
    const src = local(original(node));
    const alt = (node.getAttribute('alt') || '').replace(/[[\]]/g, '');
    return `![${alt}](${encodeURI(src)})`;
  },
});
td.addRule('video', {
  filter: (node) => node.nodeName === 'IFRAME',
  replacement: (_c, node) => {
    const src = (node.getAttribute('src') || '').replace(/\?feature=oembed$/, '');
    const title = node.getAttribute('title') || 'Video';
    return `\n\n<div class="video"><iframe src="${src}" title="${title}" loading="lazy" allowfullscreen></iframe></div>\n\n`;
  },
});
// Galerías: todas las imágenes juntas en un mismo párrafo (el CSS las muestra en grilla).
td.addRule('galeria', {
  filter: (node) => node.nodeName === 'FIGURE' && /wp-block-gallery|gallery/.test(node.className),
  replacement: (content) => '\n\n' + content.replace(/\n+/g, ' ').trim() + '\n\n',
});
td.addRule('figura', {
  filter: (node) => node.nodeName === 'FIGURE' || node.nodeName === 'DL' || node.nodeName === 'DT',
  replacement: (content) => '\n\n' + content.trim() + '\n\n',
});
// Botones (bloque Botones y Gutentor): enlace solo en su párrafo, que el sitio muestra como botón.
td.addRule('boton', {
  filter: (node) =>
    node.nodeName === 'A' && /(wp-block-button__link|gutentor-button)/.test(node.className),
  replacement: (content, node) => {
    const href = local(node.getAttribute('href'));
    return `\n\n[${content.replace(/\s+/g, ' ').trim()}](${encodeURI(href)})\n\n`;
  },
});
td.addRule('enlace', {
  filter: (node) => node.nodeName === 'A' && node.getAttribute('href'),
  replacement: (content, node) => {
    let href = node.getAttribute('href');
    if (href.startsWith(SITE + '/wp-content/uploads/')) href = encodeURI(local(href));
    else if (href.startsWith(SITE)) href = href.slice(SITE.length) || '/';
    if (!content.trim()) return '';
    return `[${content}](${href})`;
  },
});

function md(html) {
  return td
    .turndown(limpiarHtml(html))
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*(\\?-)?\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const texto = (html) =>
  html.replace(/<[^>]+>/g, '').replace(/&#8211;/g, '–').replace(/&#8217;/g, '’')
    .replace(/&hellip;|\[&hellip;\]/g, '…').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&#8220;|&#8221;/g, '"').replace(/\s+/g, ' ').trim();

const yamlStr = (s) => JSON.stringify(s);

function escribir(dir, slug, front, body) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(front)) {
    if (v === undefined || v === null || v === '') continue;
    lines.push(`${k}: ${typeof v === 'string' ? yamlStr(v) : v}`);
  }
  lines.push('---', '', body, '');
  const out = path.join(ROOT, 'src/content', dir, slug + '.md');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, lines.join('\n'));
}

for (const p of posts) {
  const categoria = categories[p.categories[0]] || 'noticias';
  let html = p.content.rendered;
  let documento;
  // Circulares: el PDF va en su propio campo para que el CMS lo maneje como archivo.
  const pdf = html.match(/href="([^"]+\.pdf)"/i);
  if (categoria === 'circulares' && pdf) {
    documento = local(pdf[1]);
    html = html.replace(/<div[^>]*wp-block-file[\s\S]*?<\/div>/, '');
  }
  let resumen = texto(p.excerpt.rendered).replace(/\s*…$/, '');
  if (resumen.length > 220) resumen = resumen.slice(0, 217).replace(/\s+\S*$/, '') + '…';
  escribir('noticias', p.slug, {
    titulo: texto(p.title.rendered),
    fecha: p.date.slice(0, 10),
    categoria,
    imagen: p.featured_media ? local(mediaById[p.featured_media]) : undefined,
    documento,
    resumen: documento ? undefined : resumen,
    destacada: DESTACADAS.has(p.slug) ? true : undefined,
  }, md(html));
}

for (const p of pages) {
  if (OMITIR.has(p.slug)) continue;
  escribir('paginas', p.slug, {
    titulo: texto(p.title.rendered).replace(/\.$/, ''),
    imagen: p.featured_media ? local(mediaById[p.featured_media]) : undefined,
  }, md(p.content.rendered));
}

// Archivos usados por el diseño (logos, favicon).
for (const u of [
  `${SITE}/wp-content/uploads/2025/01/cropped-logo-240x100-1.png`,
  `${SITE}/wp-content/uploads/2025/08/logo-mdch-1-e1755496531297.png`,
  `${SITE}/wp-content/uploads/2025/01/cropped-favicon-mdch-192x192.png`,
  `${SITE}/wp-content/uploads/2025/01/cropped-favicon-mdch-32x32.png`,
]) local(u);

// Descarga de imágenes y PDFs a public/uploads
let ok = 0, fallos = [];
for (const url of descargas) {
  const rel = decodeURI(url).match(/\/wp-content\/uploads\/(.+)$/)[1];
  const out = path.join(ROOT, 'public/uploads', rel);
  if (fs.existsSync(out)) { ok++; continue; }
  const res = await fetch(url);
  if (!res.ok) { fallos.push(`${res.status} ${url}`); continue; }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  ok++;
}
console.log(`Noticias: ${posts.length}, páginas: ${pages.length - OMITIR.size}, archivos: ${ok}`);
if (fallos.length) console.log('No se pudieron descargar:\n' + fallos.join('\n'));
