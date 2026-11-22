import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import rehypeMch from './src/lib/rehype-mch.mjs';

// En GitHub Pages sin dominio propio el sitio vive en /mch-web/; el flujo de despliegue
// define ASTRO_SITE y ASTRO_BASE. Con el dominio del colegio, base es "/".
const site = process.env.ASTRO_SITE || 'https://colegiomarinadechile.cl';
const base = process.env.ASTRO_BASE || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  // Los estilos van dentro de cada página: así una página guardada en caché nunca pide
  // una hoja de estilos de una publicación anterior que ya no existe.
  build: { inlineStylesheets: 'always' },
  // Desde Astro 7 el procesador por defecto es Sätteri; el plugin rehype necesita el
  // procesador unified (remark/rehype) de @astrojs/markdown-remark.
  markdown: {
    processor: unified({ rehypePlugins: [[rehypeMch, { base }]] }),
  },
});
