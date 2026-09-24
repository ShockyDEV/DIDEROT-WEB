"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Languages, Loader2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { Button, buttonClassName } from "@/components/ui/button";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { inputClass, labelClass, textareaClass } from "@/components/admin/form-fields";
import { errorMessage, sendJson, uploadFile } from "@/components/admin/admin-fetch";
import { ACCEPT_IMAGE_UPLOAD } from "@/lib/admin-options";
import { NEWS_CATEGORIES } from "@/lib/content/news";
import { slugify } from "@/lib/slugify";
import { cn } from "@/lib/cn";

export interface NewsFormValues {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string; // yyyy-mm-dd o ""
}

const CATEGORIES = NEWS_CATEGORIES as readonly string[];

const EMPTY: NewsFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  content: "<p></p>",
  coverImage: "",
  category: CATEGORIES[0] ?? "",
  status: "DRAFT",
  publishedAt: "",
};

/**
 * Editor de noticia (alta y edición). El slug se genera automáticamente a
 * partir del título mientras el usuario no lo haya tocado a mano (patrón
 * mupes). Guarda contra /api/admin/news; las imágenes (del cuerpo y la
 * portada) se suben a Archivos.
 */
export function NewsEditor({ initial }: Readonly<{ initial?: NewsFormValues }>) {
  const router = useRouter();
  const [values, setValues] = useState<NewsFormValues>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInput = useRef<HTMLInputElement>(null);
  // El slug deja de autogenerarse cuando el usuario lo edita a mano.
  const slugTouched = useRef(Boolean(initial?.id));

  const isNew = !values.id;

  // Imágenes presentes en el cuerpo de la noticia (para elegir la portada).
  const contentImages = useMemo(() => {
    const urls: string[] = [];
    const re = /<img\b[^>]*\bsrc="([^"]+)"/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(values.content)) !== null) {
      if (!urls.includes(m[1])) urls.push(m[1]);
    }
    return urls;
  }, [values.content]);

  // Todas las candidatas a portada: la actual (aunque sea externa) primero.
  const coverCandidates = useMemo(() => {
    const list = [...contentImages];
    if (values.coverImage && !list.includes(values.coverImage)) {
      list.unshift(values.coverImage);
    }
    return list;
  }, [contentImages, values.coverImage]);

  // Una noticia migrada puede tener una categoría que ya no existe.
  const categoryOptions = CATEGORIES.includes(values.category)
    ? CATEGORIES
    : [...CATEGORIES, values.category];

  function update<K extends keyof NewsFormValues>(key: K, value: NewsFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleTitle(title: string) {
    setValues((v) => ({
      ...v,
      title,
      slug: slugTouched.current ? v.slug : slugify(title),
    }));
  }

  async function handleCoverUpload(file: File) {
    setUploadingCover(true);
    try {
      const item = await uploadFile(file, { only: "image", folder: "news" });
      update("coverImage", item.url);
      toast.success("Portada subida");
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo subir la imagen"));
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSave() {
    if (values.title.trim().length < 3) {
      toast.error("El título es obligatorio");
      return;
    }
    if (!CATEGORIES.includes(values.category)) {
      toast.error("Elige una categoría de la lista");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: values.title,
        slug: values.slug,
        excerpt: values.excerpt,
        content: values.content,
        coverImage: values.coverImage,
        category: values.category,
        status: values.status,
        publishedAt: values.publishedAt
          ? new Date(`${values.publishedAt}T12:00:00Z`).toISOString()
          : null,
      };
      if (isNew) await sendJson("/api/admin/news", "POST", payload);
      else await sendJson(`/api/admin/news/${values.id}`, "PUT", payload);

      toast.success("Guardado");
      router.push("/backstage/news");
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo guardar"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/backstage/news"
          className={cn(buttonClassName({ variant: "ghost", size: "sm" }), "gap-2")}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 pt-6">
          <h3 className="text-base font-semibold text-gray-900">
            {isNew ? "Nueva noticia" : "Editar noticia"}
          </h3>
        </div>
        <div className="flex flex-col gap-4 px-6 pb-6 pt-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="n-title" className={labelClass}>
                Título
              </label>
              <input
                id="n-title"
                type="text"
                value={values.title}
                onChange={(e) => handleTitle(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="n-slug" className={labelClass}>
                Slug (dirección: /noticias/…)
              </label>
              <input
                id="n-slug"
                type="text"
                value={values.slug}
                onChange={(e) => {
                  slugTouched.current = true;
                  update("slug", e.target.value);
                }}
                className={cn(inputClass, "font-mono text-[13px] text-gray-600")}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="n-excerpt" className={labelClass}>
              Extracto
            </label>
            <textarea
              id="n-excerpt"
              rows={3}
              value={values.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
              className={textareaClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className={labelClass}>Contenido</span>
            <RichTextEditor
              value={values.content}
              onChange={(html) => update("content", html)}
            />
          </div>

          {/* Selector de imagen de portada */}
          <div className="flex flex-col gap-2">
            <span className={labelClass}>Imagen de portada</span>
            <p className="text-xs text-gray-500">
              Marca cuál de las imágenes del contenido será la cabecera de la noticia
              (se mostrará arriba y no se repetirá dentro del texto) o sube una aparte.
            </p>
            {coverCandidates.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {coverCandidates.map((url) => {
                  const selected = url === values.coverImage;
                  return (
                    <button
                      key={url}
                      type="button"
                      onClick={() => update("coverImage", selected ? "" : url)}
                      aria-pressed={selected}
                      title={selected ? "Portada actual — clic para quitarla" : "Usar como portada"}
                      className={cn(
                        "relative h-[84px] w-[112px] overflow-hidden rounded-md border-2 bg-gray-50 transition-all",
                        selected
                          ? "border-diderot-violet ring-2 ring-diderot-violet/30"
                          : "border-gray-200 hover:border-gray-300",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className={cn(
                          "h-full w-full object-cover transition-opacity",
                          !selected && "opacity-90",
                        )}
                      />
                      <span
                        className={cn(
                          "absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                          selected
                            ? "border-diderot-violet bg-diderot-violet text-white"
                            : "border-white/80 bg-black/25 text-transparent",
                        )}
                      >
                        <Check className="h-3 w-3" aria-hidden="true" />
                      </span>
                      {selected ? (
                        <span className="absolute inset-x-0 bottom-0 bg-diderot-violet/90 py-0.5 text-center text-[10px] font-semibold text-white">
                          Portada
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Aún no hay imágenes en el contenido. Insértalas con el botón de imagen
                del editor o sube una portada aparte.
              </p>
            )}
            <div className="mt-1 flex items-center gap-2">
              <input
                id="n-cover"
                type="text"
                aria-label="Dirección de la imagen de portada"
                value={values.coverImage}
                onChange={(e) => update("coverImage", e.target.value)}
                placeholder="o pega la dirección de una imagen (/uploads/…)"
                className={cn(inputClass, "min-w-0 flex-1 text-[13px] text-gray-600")}
              />
              <button
                type="button"
                disabled={uploadingCover}
                onClick={() => coverInput.current?.click()}
                className="inline-flex h-10 flex-none items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                {uploadingCover ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Upload className="h-4 w-4" aria-hidden="true" />
                )}
                {uploadingCover ? "Subiendo…" : "Subir portada"}
              </button>
              <input
                ref={coverInput}
                type="file"
                accept={ACCEPT_IMAGE_UPLOAD}
                className="hidden"
                tabIndex={-1}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleCoverUpload(f);
                  e.target.value = "";
                }}
              />
              {values.coverImage ? (
                <button
                  type="button"
                  onClick={() => update("coverImage", "")}
                  className="flex-none text-xs text-gray-500 hover:text-red-600"
                >
                  Sin portada
                </button>
              ) : null}
            </div>
          </div>

          {/* Categoría / Estado / Fecha */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="n-cat" className={labelClass}>
                Categoría
              </label>
              <select
                id="n-cat"
                value={values.category}
                onChange={(e) => update("category", e.target.value)}
                className={inputClass}
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORIES.includes(c) ? c : `${c} (antigua: elige otra)`}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="n-status" className={labelClass}>
                Estado
              </label>
              <select
                id="n-status"
                value={values.status}
                onChange={(e) => update("status", e.target.value as NewsFormValues["status"])}
                className={inputClass}
              >
                <option value="PUBLISHED">Publicada</option>
                <option value="DRAFT">Borrador</option>
                <option value="ARCHIVED">Archivada</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="n-date" className={labelClass}>
                Fecha de publicación
              </label>
              <input
                id="n-date"
                type="date"
                value={values.publishedAt}
                onChange={(e) => update("publishedAt", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
            <Link href="/backstage/news" className={buttonClassName({ variant: "ghost" })}>
              Cancelar
            </Link>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
              <Languages className="h-[13px] w-[13px]" aria-hidden="true" />
              Se traduce automáticamente al inglés al guardar (si la traducción está
              configurada)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
