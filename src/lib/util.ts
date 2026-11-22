import { getCollection, type CollectionEntry } from 'astro:content';

/** Agrega el prefijo "base" del sitio a rutas internas. Las URLs externas no se tocan. */
export function url(ruta?: string | null): string {
  if (!ruta) return '';
  if (/^(https?:|mailto:|tel:|#)/.test(ruta)) return ruta;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + (ruta.startsWith('/') ? ruta : '/' + ruta);
}

export const esExterno = (ruta: string) => /^https?:\/\//.test(ruta);

export const CATEGORIAS: Record<string, string> = {
  noticias: 'Noticias',
  informacion: 'Información',
  circulares: 'Circulares',
};

const formato = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const fechaLarga = (d: Date) => {
  const [dia, , mes, , anio] = formato.formatToParts(d).map((p) => p.value);
  return `${mes} ${dia}, ${anio}`;
};

export async function noticiasOrdenadas(categoria?: string) {
  const todas = await getCollection('noticias', (n) => !n.data.borrador && (!categoria || n.data.categoria === categoria));
  // Más recientes primero; si comparten fecha, la de número mayor (ej. circular-16 antes que circular-15).
  return todas.sort((a, b) => b.data.fecha.getTime() - a.data.fecha.getTime() || b.id.localeCompare(a.id, 'es', { numeric: true }));
}

export type Noticia = CollectionEntry<'noticias'>;
export const POR_PAGINA = 9;
