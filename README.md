# Sitio web Colegio Marina de Chile

Sitio estático de [colegiomarinadechile.cl](https://colegiomarinadechile.cl), hecho con [Astro](https://astro.build)
y editable desde el panel [Pages CMS](https://pagescms.org). Reemplaza al WordPress anterior: mismas secciones,
mismo diseño y mismas direcciones (por ejemplo `/admision/`, `/pise/`, `/category/circulares/`).

## Editar el contenido (sin programar)

1. Entra a **https://app.pagescms.org** y presiona *Sign in with GitHub*.
2. Elige el repositorio **colegiomarinadechile/web**.
3. En el menú de la izquierda verás:
   - **Noticias y circulares**: crear una noticia, una circular (con su PDF) o un aviso.
     Marca *Destacar en el carrusel* para que aparezca arriba en la portada.
   - **Páginas**: PEI, Reglamento Interno, Admisión, etc.
   - **Próximas actividades**: la agenda de la portada (las fechas pasadas se ocultan solas).
   - **Portada y datos del colegio**: las 3 tarjetas bajo el carrusel, publicaciones de Instagram,
     redes sociales, dirección, teléfono y enlaces del pie de página.
   - **Menú principal**: opciones y submenús.
4. Presiona **Save**. El sitio se actualiza solo en 1 a 2 minutos.

Para que otra persona pueda editar, agrégala como colaboradora del repositorio en GitHub
(*Settings → Collaborators*).

## Publicación

Cada cambio en la rama `main` se publica automáticamente en GitHub Pages
(`.github/workflows/deploy.yml`).

**Activar la primera vez:** en GitHub, *Settings → Pages → Build and deployment → Source: GitHub Actions*.
El sitio queda en `https://colegiomarinadechile.github.io/web/`.

**Usar el dominio del colegio:** en *Settings → Pages → Custom domain* escribe `colegiomarinadechile.cl`
y en el proveedor del dominio apunta el DNS a GitHub Pages
([instrucciones](https://docs.github.com/es/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)):
registros `A` a 185.199.108.153, 185.199.109.153, 185.199.110.153 y 185.199.111.153, y `CNAME` de `www` a
`colegiomarinadechile.github.io`. Luego activa *Enforce HTTPS*.

## Desarrollo

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # genera dist/
```

| Carpeta | Contenido |
|---|---|
| `src/content/noticias/` | Noticias, circulares e información (Markdown) |
| `src/content/paginas/` | Páginas del menú (Markdown) |
| `src/data/*.json` | Menú, portada, redes y agenda |
| `public/uploads/` | Imágenes y PDFs (misma estructura que WordPress) |
| `src/styles/sitio.css` | Diseño (colores del tema original) |
| `scripts/migrar-wordpress.mjs` | Script usado para importar el contenido desde WordPress |

En el contenido, un enlace solo en su propio párrafo se muestra como botón, y varias imágenes
seguidas se muestran como galería.

## Pendientes heredados del sitio anterior

Estos archivos ya no existían en el WordPress (daban error 404) y hay que volver a subirlos:

- Horarios Cursos: PDFs de Primer Ciclo, Segundo Ciclo y Enseñanza Media.
- Página Circulares (2024): circulares N°3, 5, 7, 9, 10 y 12.

Páginas que en WordPress estaban vacías y muestran "Estamos actualizando esta sección":
Equipo Directivo, Equipo PIE, Docentes, Asistentes de la Educación, Centro de Estudiantes,
Centro de Padres, Plan de Apoyo a la Inclusión, Protocolos, Plan Lector y Uniforme Oficial.
