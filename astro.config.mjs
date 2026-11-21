import { defineConfig } from 'astro/config';
import rehypeMch from './src/lib/rehype-mch.mjs';

// En GitHub Pages sin dominio propio el sitio vive en /mch-web/; el flujo de despliegue
// define ASTRO_SITE y ASTRO_BASE. Con el dominio del colegio, base es "/".
const site = process.env.ASTRO_SITE || 'https://colegiomarinadechile.cl';
const base = process.env.ASTRO_BASE || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  markdown: {
    rehypePlugins: [[rehypeMch, { base }]],
  },
});
