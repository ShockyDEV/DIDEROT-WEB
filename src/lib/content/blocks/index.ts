/**
 * Módulos de contenido por página, en el orden en que se muestran en el
 * panel (Contenido → Páginas). Para añadir una página: crear su módulo en
 * esta carpeta y registrarlo aquí.
 */
import type { PageContentModule } from "./types";
import { content as inicio } from "./inicio";
import { content as grupo } from "./grupo";
import { content as investigacion } from "./investigacion";
import { content as publicaciones } from "./publicaciones";
import { content as transferencia } from "./transferencia";
import { content as formacion } from "./formacion";
import { content as eventos } from "./eventos";
import { content as noticias } from "./noticias";
import { content as contacto } from "./contacto";
import { content as legal } from "./legal";

export const PAGE_MODULES: PageContentModule[] = [
  inicio,
  grupo,
  investigacion,
  publicaciones,
  transferencia,
  formacion,
  eventos,
  noticias,
  contacto,
  legal,
];
