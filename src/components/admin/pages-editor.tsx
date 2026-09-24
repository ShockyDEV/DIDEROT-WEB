"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Languages, Link2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { ListBlockEditor } from "@/components/admin/list-block-editor";
import { errorMessage, sendJson } from "@/components/admin/admin-fetch";
import { isUrlBlockKey } from "@/lib/admin-options";
import { ICON_NAMES } from "@/lib/icon-map";
import { PAGE_BLOCKS } from "@/lib/content/page-blocks";
import { LIST_BLOCKS, type ListItem } from "@/lib/content/list-blocks";

const inputClass =
  "h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25";

/* ── tipos de bloque ─────────────────────────────────────────────────────────
 * Cada bloque se edita con el control adecuado a su contenido:
 *  - claves «url-…» / «…-url»: un campo de enlace (no un editor de texto)
 *  - el resto: editor de texto enriquecido
 * Los títulos del registro siguen la convención «Sección — detalle», que se
 * usa para agrupar los bloques por secciones dentro de cada página. */

const isUrlBlock = isUrlBlockKey;

function sectionOf(title: string) {
  return title.includes("—") ? title.split("—")[0].trim() : "";
}

function detailOf(title: string) {
  return title.includes("—")
    ? title.slice(title.indexOf("—") + 1).trim()
    : title;
}

/** Texto plano de un bloque almacenado como HTML (p. ej. «<p>https://…</p>»). */
function htmlToPlain(html: string) {
  return html
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ── cabecera común de cada tarjeta de bloque ───────────────────────────── */

function BlockHeader({
  title,
  dirty,
  canReset,
  onReset,
  onSave,
  saving,
  autoEn,
  extra,
}: Readonly<{
  title: string;
  dirty: boolean;
  canReset: boolean;
  onReset: () => void;
  onSave: () => void;
  saving: boolean;
  autoEn: boolean;
  extra?: React.ReactNode;
}>) {
  return (
    <div className="flex items-center justify-between gap-3 px-6 py-4">
      <div className="flex min-w-0 items-center gap-2">
        <h4 className="truncate text-[14px] font-semibold text-gray-900">
          {title}
        </h4>
        {dirty ? (
          <span
            title="Cambios sin guardar"
            className="inline-block h-2 w-2 flex-none rounded-full bg-[#FBBF24]"
          />
        ) : null}
      </div>
      <div className="flex flex-none items-center gap-2.5">
        {extra}
        {autoEn ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
            <Languages className="h-3 w-3" aria-hidden="true" />
            Auto EN
          </span>
        ) : null}
        {canReset ? (
          <button
            type="button"
            onClick={onReset}
            title="Volver al valor original de este bloque"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 transition-colors hover:text-gray-700"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Restablecer original
          </button>
        ) : null}
        <Button
          variant={dirty ? "primary" : "outline"}
          size="sm"
          onClick={onSave}
          disabled={saving || !dirty}
        >
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </div>
  );
}

/** Guarda un bloque; devuelve true si además se tradujo al inglés. */
async function saveBlock(pageSlug: string, blockKey: string, content: string) {
  const json = await sendJson<{ translated?: boolean }>("/api/admin/content-blocks", "PUT", {
    pageSlug,
    blockKey,
    content,
  });
  return Boolean(json.translated);
}

/* ── bloque de enlace (URL) ─────────────────────────────────────────────── */

interface UrlBlockEditorProps {
  pageSlug: string;
  blockKey: string;
  title: string;
  initialContent: string;
  defaultContent: string;
}

function UrlBlockEditor({
  pageSlug,
  blockKey,
  title,
  initialContent,
  defaultContent,
}: Readonly<UrlBlockEditorProps>) {
  const defaultUrl = htmlToPlain(defaultContent);
  const [url, setUrl] = useState(htmlToPlain(initialContent));
  const [savedUrl, setSavedUrl] = useState(htmlToPlain(initialContent));
  const [saving, setSaving] = useState(false);
  const dirty = url.trim() !== savedUrl.trim();

  function handleReset() {
    setUrl(defaultUrl);
    toast("Valor original restaurado: revisa y pulsa Guardar", { icon: "↩️" });
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Se guarda con el mismo formato del registro («<p>URL</p>»); la web
      // extrae el texto plano al leerlo.
      const value = url.trim();
      await saveBlock(pageSlug, blockKey, `<p>${escapeHtml(value)}</p>`);
      setSavedUrl(value);
      toast.success("Guardado");
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo guardar"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <BlockHeader
        title={title}
        dirty={dirty}
        canReset={url.trim() !== defaultUrl}
        onReset={handleReset}
        onSave={handleSave}
        saving={saving}
        autoEn={false}
        extra={
          url.trim() ? (
            <a
              href={url.trim()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-diderot-violet hover:underline"
            >
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              Abrir
            </a>
          ) : null
        }
      />
      <div className="px-6 pb-5">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 flex-none text-gray-400" aria-hidden="true" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://… (vacío = ocultar)"
            className={inputClass + " w-full"}
          />
        </div>
      </div>
    </div>
  );
}

/* ── bloque de texto enriquecido ────────────────────────────────────────── */

interface BlockEditorProps {
  pageSlug: string;
  blockKey: string;
  title: string;
  initialContent: string;
  /** Texto de fábrica del bloque (registro): permite restablecerlo. */
  defaultContent: string;
}

function BlockEditor({
  pageSlug,
  blockKey,
  title,
  initialContent,
  defaultContent,
}: Readonly<BlockEditorProps>) {
  const [content, setContent] = useState(initialContent);
  const [savedContent, setSavedContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  // Remonta el RichTextEditor al restablecer (su estado interno es propio)
  const [editorKey, setEditorKey] = useState(0);
  const dirty = content !== savedContent;

  function handleReset() {
    if (
      !window.confirm(
        "¿Restablecer este bloque al texto original? (Tendrás que pulsar Guardar para publicarlo.)",
      )
    )
      return;
    setContent(defaultContent);
    setEditorKey((k) => k + 1);
    toast("Texto original restaurado: revisa y pulsa Guardar", { icon: "↩️" });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const translated = await saveBlock(pageSlug, blockKey, content);
      setSavedContent(content);
      toast.success(translated ? "Guardado y traducido automáticamente (EN)" : "Guardado");
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo guardar"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <BlockHeader
        title={title}
        dirty={dirty}
        canReset={content !== defaultContent}
        onReset={handleReset}
        onSave={handleSave}
        saving={saving}
        autoEn
      />
      <div className="px-6 pb-6">
        <RichTextEditor
          key={editorKey}
          value={content}
          onChange={setContent}
          minHeight={130}
          uploadFolder="pages"
        />
      </div>
    </div>
  );
}

/* ── separador de sección ───────────────────────────────────────────────── */

function SectionHeading({ children }: Readonly<{ children: string }>) {
  return (
    <h3 className="mt-4 border-b border-gray-200 pb-1.5 text-[13px] font-semibold uppercase tracking-wide text-gray-500 first:mt-0">
      {children}
    </h3>
  );
}

interface PagesEditorProps {
  /** Contenido guardado en BD: clave "pageSlug:blockKey" → HTML. */
  saved: Record<string, string>;
}

export function PagesEditor({ saved }: Readonly<PagesEditorProps>) {
  const [pageSlug, setPageSlug] = useState(PAGE_BLOCKS[0]?.pageSlug ?? "");
  const page = useMemo(
    () => PAGE_BLOCKS.find((p) => p.pageSlug === pageSlug) ?? PAGE_BLOCKS[0],
    [pageSlug],
  );
  const lists = useMemo(
    () => LIST_BLOCKS.filter((l) => l.pageSlug === pageSlug),
    [pageSlug],
  );

  // Registro de contenido todavía vacío: nada que editar (sin romper).
  if (!page) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm">
        <p className="text-sm text-gray-500">
          Todavía no hay páginas con contenido editable. Los bloques se declaran en
          src/lib/content/blocks/*.ts.
        </p>
      </div>
    );
  }

  // Bloques agrupados por la sección del título («Sección — detalle»).
  let lastSection: string | null = null;

  return (
    <div className="flex flex-col gap-5">
      {/* Sugerencias de iconos para todos los campos «icono» de las listas */}
      <datalist id="lucide-icons">
        {ICON_NAMES.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
        <label
          htmlFor="page-select"
          className="flex-none text-[13px] font-medium text-gray-700"
        >
          Página
        </label>
        <select
          id="page-select"
          value={pageSlug}
          onChange={(e) => setPageSlug(e.target.value)}
          className={inputClass + " min-w-[280px]"}
        >
          {PAGE_BLOCKS.map((p) => (
            <option key={p.pageSlug} value={p.pageSlug}>
              {p.label}
            </option>
          ))}
        </select>
        <p className="min-w-[240px] flex-1 text-xs text-gray-500">
          Cada página de la web de DIDEROT se compone de piezas agrupadas por
          secciones: textos, enlaces y listas. Cada pieza se guarda por separado;
          los textos se traducen automáticamente al inglés (si la traducción está
          configurada).
        </p>
      </div>

      {page.blocks.map((b) => {
        const section = sectionOf(b.title);
        const heading =
          section && section !== lastSection ? (
            <SectionHeading>{section}</SectionHeading>
          ) : null;
        lastSection = section || lastSection;
        const common = {
          pageSlug: page.pageSlug,
          blockKey: b.blockKey,
          title: detailOf(b.title),
          initialContent:
            saved[`${page.pageSlug}:${b.blockKey}`] ?? b.defaultContent,
          defaultContent: b.defaultContent,
        };
        return (
          <div key={`${page.pageSlug}:${b.blockKey}`} className="flex flex-col gap-5">
            {heading}
            {isUrlBlock(b.blockKey) ? (
              <UrlBlockEditor {...common} />
            ) : (
              <BlockEditor {...common} />
            )}
          </div>
        );
      })}

      {/* Listas estructuradas de la página (iconos, tarjetas, filas…) */}
      {lists.length > 0 ? (
        <SectionHeading>Listas de la página</SectionHeading>
      ) : null}
      {lists.map((def) => {
        const raw = saved[`${def.pageSlug}:${def.blockKey}`];
        let initial = def.defaultItems;
        if (raw) {
          try {
            const parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed)) initial = parsed as ListItem[];
          } catch {
            // JSON corrupto: se parte de los valores por defecto
          }
        }
        return (
          <ListBlockEditor
            key={`${def.pageSlug}:${def.blockKey}`}
            def={def}
            initialItems={initial}
          />
        );
      })}
    </div>
  );
}
