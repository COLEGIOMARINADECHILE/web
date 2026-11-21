// Ajustes al HTML generado desde Markdown:
// 1. Un párrafo que contiene solo un enlace se muestra como botón.
// 2. Párrafos seguidos que contienen solo imágenes se agrupan en una galería.
// 3. Las rutas internas (/uploads/..., /pagina/) reciben el prefijo "base" del sitio.
// 4. Imágenes con carga diferida y enlaces externos en pestaña nueva.

const esEspacio = (n) => n.type === 'text' && !n.value.trim();
const hijos = (n) => (n.children || []).filter((c) => !esEspacio(c) && !(c.type === 'element' && c.tagName === 'br'));

function soloImagenes(n) {
  if (n.type !== 'element' || n.tagName !== 'p') return false;
  const h = hijos(n);
  return h.length > 0 && h.every((c) => c.type === 'element' && (c.tagName === 'img' ||
    (c.tagName === 'a' && hijos(c).length === 1 && hijos(c)[0].tagName === 'img')));
}

export default function rehypeMch({ base = '/' } = {}) {
  const prefijo = base.replace(/\/$/, '');
  const fijar = (url) =>
    prefijo && typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') && !url.startsWith(prefijo + '/')
      ? prefijo + url
      : url;

  function recorrer(nodo) {
    if (!nodo.children) return;
    const nuevos = [];
    for (let i = 0; i < nodo.children.length; i++) {
      const c = nodo.children[i];
      if (soloImagenes(c)) {
        const imgs = [...hijos(c)];
        let j = i + 1;
        while (j < nodo.children.length && (esEspacio(nodo.children[j]) || soloImagenes(nodo.children[j]))) {
          if (!esEspacio(nodo.children[j])) imgs.push(...hijos(nodo.children[j]));
          j++;
        }
        if (imgs.length > 1) {
          nuevos.push({ type: 'element', tagName: 'div', properties: { className: ['galeria'] }, children: imgs });
          i = j - 1;
          continue;
        }
      }
      nuevos.push(c);
    }
    nodo.children = nuevos;

    for (const c of nodo.children) {
      if (c.type !== 'element') continue;
      const p = c.properties || (c.properties = {});
      if (c.tagName === 'img') {
        p.src = fijar(p.src);
        p.loading = 'lazy';
        p.decoding = 'async';
      }
      if (c.tagName === 'a') {
        p.href = fijar(p.href);
        if (/^https?:\/\//.test(p.href || '') || /\.pdf$/i.test(p.href || '')) {
          p.target = '_blank';
          p.rel = ['noopener'];
        }
      }
      if (c.tagName === 'iframe') p.src = fijar(p.src);
      if (c.tagName === 'p') {
        const h = hijos(c);
        if (h.length === 1 && h[0].type === 'element' && h[0].tagName === 'a' && !hijos(h[0]).some((x) => x.tagName === 'img')) {
          p.className = [...(p.className || []), 'parrafo-boton'];
          h[0].properties.className = [...(h[0].properties.className || []), 'boton'];
        }
      }
      recorrer(c);
    }
  }
  return (arbol) => recorrer(arbol);
}
