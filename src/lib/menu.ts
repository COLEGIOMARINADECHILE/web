import sitio from '../data/sitio.json';
import { resolverEnlace, type EnlaceCMS } from './util';

type ItemCMS = EnlaceCMS & { submenu?: EnlaceCMS[] | null };

/** Menú principal (definido en Pages CMS, en «Sitio: menú, pie y datos») con los enlaces ya resueltos. */
export async function menuPrincipal() {
  return Promise.all(
    (sitio.menu as ItemCMS[]).map(async (item) => ({
      ...(await resolverEnlace(item)),
      submenu: await Promise.all((item.submenu ?? []).map(resolverEnlace)),
    }))
  );
}

/** Lista de enlaces del pie de página, resueltos. */
export const enlacesPie = (lista: EnlaceCMS[]) => Promise.all(lista.map(resolverEnlace));
