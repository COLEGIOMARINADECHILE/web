import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const noticias = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/noticias' }),
  schema: z.object({
    titulo: z.string(),
    fecha: z.coerce.date(),
    categoria: z.enum(['noticias', 'informacion', 'circulares']).default('noticias'),
    imagen: z.string().optional().nullable(),
    documento: z.string().optional().nullable(),
    resumen: z.string().optional().nullable(),
    destacada: z.boolean().optional().default(false),
    borrador: z.boolean().optional().default(false),
  }),
});

const paginas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/paginas' }),
  schema: z.object({
    titulo: z.string(),
    imagen: z.string().optional().nullable(),
    resumen: z.string().optional().nullable(),
    reune: z.array(z.string()).optional().nullable(),
    destacada: z.boolean().optional().default(false),
    orden: z.number().optional().nullable(),
  }),
});

export const collections = { noticias, paginas };
