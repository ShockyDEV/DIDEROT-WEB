"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/admin/modal";
import {
  CheckboxField,
  Field,
  IconButton,
  inputClass,
  textareaClass,
} from "@/components/admin/form-fields";
import { AdminApiError, errorMessage, sendJson } from "@/components/admin/admin-fetch";
import {
  ACCEPT_IMAGE_UPLOAD,
  MEMBER_CATEGORIES,
  memberCategoryLabel,
  type MemberCategoryValue,
} from "@/lib/admin-options";
import { parseOrcidId } from "@/lib/orcid-import";
import { cn } from "@/lib/cn";

export interface MemberRow {
  id: string;
  name: string;
  category: MemberCategoryValue;
  role: string | null;
  roleEn: string | null;
  affiliation: string | null;
  area: string | null;
  bio: string | null;
  bioEn: string | null;
  email: string | null;
  photo: string | null;
  portalUrl: string | null;
  orcid: string | null;
  scopus: string | null;
  scholar: string | null;
  website: string | null;
  active: boolean;
  order: number;
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

type FormState = {
  id?: string;
  order: string;
} & {
  [K in Exclude<keyof MemberRow, "id" | "order" | "active" | "category">]: string;
} & { active: boolean; category: MemberCategoryValue };

function emptyForm(category: MemberCategoryValue = "RESEARCHER"): FormState {
  return {
    name: "",
    category,
    role: "",
    roleEn: "",
    affiliation: "",
    area: "",
    bio: "",
    bioEn: "",
    email: "",
    photo: "",
    portalUrl: "",
    orcid: "",
    scopus: "",
    scholar: "",
    website: "",
    active: true,
    order: "0",
  };
}

function toForm(row: MemberRow): FormState {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    role: row.role ?? "",
    roleEn: row.roleEn ?? "",
    affiliation: row.affiliation ?? "",
    area: row.area ?? "",
    bio: row.bio ?? "",
    bioEn: row.bioEn ?? "",
    email: row.email ?? "",
    photo: row.photo ?? "",
    portalUrl: row.portalUrl ?? "",
    orcid: row.orcid ?? "",
    scopus: row.scopus ?? "",
    scholar: row.scholar ?? "",
    website: row.website ?? "",
    active: row.active,
    order: String(row.order),
  };
}

/**
 * Equipo del grupo (página «El grupo» → Equipo): fichas agrupadas por
 * categoría, con foto (recortada a 512×512 en el servidor), perfiles
 * académicos y semblanza. El ORCID de la ficha es el que se usa para
 * importar publicaciones.
 */
export function MembersSection({ rows }: Readonly<{ rows: MemberRow[] }>) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"" | MemberCategoryValue>("");
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [gallery, setGallery] = useState<{ url: string; name: string }[] | null>(null);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    return rows.filter((r) => {
      if (category && r.category !== category) return false;
      if (!q) return true;
      return [r.name, r.role, r.affiliation, r.area, r.email]
        .filter(Boolean)
        .some((v) =>
          String(v)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .includes(q),
        );
    });
  }, [rows, query, category]);

  const groups = useMemo(
    () =>
      MEMBER_CATEGORIES.filter((c) => !category || c.value === category).map((c) => ({
        ...c,
        members: filtered.filter((r) => r.category === c.value),
      })),
    [filtered, category],
  );

  async function toggleGallery() {
    const next = !galleryOpen;
    setGalleryOpen(next);
    if (next && gallery === null) {
      setGalleryLoading(true);
      try {
        const res = await fetch("/api/admin/members/photos");
        const json = await res.json().catch(() => ({}));
        setGallery(Array.isArray(json.images) ? json.images : []);
      } catch {
        setGallery([]);
      } finally {
        setGalleryLoading(false);
      }
    }
  }

  async function handlePhotoUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/members/photo", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new AdminApiError(json.error ?? "No se pudo subir la foto", res.status, json);
      }
      setForm((f) => (f ? { ...f, photo: json.photo } : f));
      setGallery(null); // que la galería incluya la recién subida al reabrir
      toast.success("Foto subida");
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo subir la foto"));
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form) return;
    if (form.name.trim().length < 2) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (form.orcid.trim() && !parseOrcidId(form.orcid)) {
      toast.error("El ORCID no es válido (formato 0000-0000-0000-0000)");
      return;
    }
    const order = Number(form.order || 0);
    if (!Number.isInteger(order) || order < 0) {
      toast.error("El orden debe ser un número entero positivo");
      return;
    }
    setSaving(true);
    try {
      const { id, ...rest } = form;
      const payload = { ...rest, order };
      if (id) await sendJson(`/api/admin/members/${id}`, "PUT", payload);
      else await sendJson("/api/admin/members", "POST", payload);
      toast.success("Ficha guardada");
      setForm(null);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo guardar"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: MemberRow) {
    if (!window.confirm(`¿Eliminar la ficha de «${row.name}»?`)) return;
    try {
      await sendJson(`/api/admin/members/${row.id}`, "DELETE");
      toast.success("Ficha eliminada");
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo eliminar"));
    }
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-[300px]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, cargo, afiliación…"
              aria-label="Buscar en el equipo"
              className={cn(inputClass, "pl-9")}
            />
          </div>
          <select
            aria-label="Filtrar por categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value as "" | MemberCategoryValue)}
            className={cn(inputClass, "w-auto")}
          >
            <option value="">Todas las categorías</option>
            {MEMBER_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.heading}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="primary"
          className="gap-1.5"
          onClick={() => setForm(emptyForm(category || "RESEARCHER"))}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo miembro
        </Button>
      </div>

      {groups.map((group) => (
        <div
          key={group.value}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="flex items-baseline justify-between p-6">
            <h3 className="text-base font-semibold text-gray-900">
              {group.heading} ({group.members.length})
            </h3>
            <p className="text-xs text-gray-500">Ordenados por el campo «Orden»</p>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-t border-gray-100">
                <th scope="col" className="px-6 py-3 text-left text-[13px] font-medium text-gray-500">
                  Nombre
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                  Cargo · Afiliación
                </th>
                <th scope="col" className="hidden px-4 py-3 text-left text-[13px] font-medium text-gray-500 lg:table-cell">
                  Perfiles
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                  Estado
                </th>
                <th scope="col" className="w-[96px] px-6 py-3 text-left text-[13px] font-medium text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {group.members.map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {row.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.photo}
                          alt=""
                          className="h-[34px] w-[34px] flex-none rounded-full object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-diderot-pale text-xs font-bold text-diderot-indigo"
                        >
                          {initialsOf(row.name)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{row.name}</p>
                        {row.email ? <p className="text-xs text-gray-500">{row.email}</p> : null}
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[320px] px-4 py-3 text-[13px] text-gray-600">
                    {[row.role, row.affiliation].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-xs lg:table-cell">
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      {(
                        [
                          ["ORCID", row.orcid],
                          ["Portal", row.portalUrl],
                          ["Scopus", row.scopus],
                          ["Scholar", row.scholar],
                          ["Web", row.website],
                        ] as const
                      )
                        .filter(([, url]) => url)
                        .map(([label, url]) => (
                          <a
                            key={label}
                            href={url as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-diderot-violet hover:underline"
                          >
                            {label}
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        ))}
                      {!row.orcid && !row.portalUrl && !row.scopus && !row.scholar && !row.website ? (
                        <span className="text-gray-400">—</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        row.active ? "bg-[#DCFCE7] text-[#15803D]" : "bg-gray-100 text-gray-700",
                      )}
                    >
                      {row.active ? "Visible" : "Oculto"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1">
                      <IconButton label={`Editar a ${row.name}`} onClick={() => setForm(toForm(row))}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                      <IconButton label={`Eliminar a ${row.name}`} danger onClick={() => handleDelete(row)}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
              {group.members.length === 0 ? (
                <tr className="border-t border-gray-100">
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    {query ? "Sin resultados en esta categoría." : "Nadie en esta categoría todavía."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ))}

      {form ? (
        <Modal
          title={form.id ? `Editar ficha (${memberCategoryLabel(form.category)})` : "Nuevo miembro"}
          onClose={() => setForm(null)}
          size="lg"
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field id="m-name" label="Nombre y apellidos *" className="sm:col-span-2">
                <input
                  id="m-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field id="m-order" label="Orden" hint="Menor = antes">
                <input
                  id="m-order"
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={(e) => set("order", e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field id="m-category" label="Categoría *">
              <select
                id="m-category"
                value={form.category}
                onChange={(e) => set("category", e.target.value as MemberCategoryValue)}
                className={inputClass}
              >
                {MEMBER_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="m-role" label="Cargo (opcional)" hint="p. ej. «Coordinador del grupo»">
                <input
                  id="m-role"
                  type="text"
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field id="m-role-en" label="Cargo en inglés" hint="Vacío = traducción automática al guardar">
                <input
                  id="m-role-en"
                  type="text"
                  value={form.roleEn}
                  onChange={(e) => set("roleEn", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field id="m-affiliation" label="Institución / afiliación" hint="p. ej. «Universidad de Salamanca»">
                <input
                  id="m-affiliation"
                  type="text"
                  value={form.affiliation}
                  onChange={(e) => set("affiliation", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field id="m-area" label="Departamento o área">
                <input
                  id="m-area"
                  type="text"
                  value={form.area}
                  onChange={(e) => set("area", e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field id="m-bio" label="Semblanza breve (texto)">
              <textarea
                id="m-bio"
                rows={3}
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                className={textareaClass}
              />
            </Field>
            <Field id="m-bio-en" label="Semblanza en inglés" hint="Vacía = traducción automática al guardar">
              <textarea
                id="m-bio-en"
                rows={3}
                value={form.bioEn}
                onChange={(e) => set("bioEn", e.target.value)}
                className={textareaClass}
              />
            </Field>

            {/* Foto */}
            <Field id="m-photo" label="Foto">
              <div className="flex items-center gap-3">
                {form.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.photo}
                    alt=""
                    className="h-16 w-16 flex-none rounded-full border border-gray-200 object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-diderot-pale text-sm font-bold text-diderot-indigo"
                  >
                    {initialsOf(form.name || "· ·")}
                  </span>
                )}
                <div className="flex flex-col items-start gap-1.5">
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => photoInput.current?.click()}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Upload className="h-4 w-4" aria-hidden="true" />
                    )}
                    {uploading ? "Subiendo…" : form.photo ? "Cambiar foto" : "Subir foto"}
                  </button>
                  <input
                    ref={photoInput}
                    type="file"
                    accept={ACCEPT_IMAGE_UPLOAD}
                    className="hidden"
                    tabIndex={-1}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handlePhotoUpload(f);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={toggleGallery}
                    className="text-left text-xs font-medium text-diderot-violet hover:underline"
                  >
                    {galleryOpen ? "Ocultar fotos subidas" : "Elegir entre las fotos ya subidas"}
                  </button>
                  {form.photo ? (
                    <button
                      type="button"
                      onClick={() => set("photo", "")}
                      className="text-left text-xs text-red-600 hover:underline"
                    >
                      Quitar foto
                    </button>
                  ) : null}
                </div>
              </div>

              {galleryOpen ? (
                <div className="max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-2">
                  {galleryLoading ? (
                    <p className="p-3 text-center text-xs text-gray-500">Cargando fotos…</p>
                  ) : gallery && gallery.length > 0 ? (
                    <div className="grid grid-cols-6 gap-2">
                      {gallery.map((img) => (
                        <button
                          key={img.url}
                          type="button"
                          title={img.name}
                          onClick={() => {
                            set("photo", img.url);
                            setGalleryOpen(false);
                          }}
                          className={cn(
                            "aspect-square overflow-hidden rounded-md border-2 transition-colors",
                            form.photo === img.url
                              ? "border-diderot-violet"
                              : "border-transparent hover:border-gray-300",
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="p-3 text-center text-xs text-gray-500">
                      No hay fotos subidas todavía.
                    </p>
                  )}
                </div>
              ) : null}

              <input
                id="m-photo"
                type="text"
                value={form.photo}
                placeholder="…o pega una dirección (/uploads/… o https://…)"
                onChange={(e) => set("photo", e.target.value)}
                className={cn(inputClass, "text-[13px] text-gray-600")}
              />
              <p className="text-xs text-gray-500">
                JPG, PNG, WebP o GIF; se recorta a 512×512 y se eliminan los datos de
                ubicación de la foto.
              </p>
            </Field>

            {/* Contacto y perfiles */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="m-email" label="Correo electrónico">
                <input
                  id="m-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field
                id="m-orcid"
                label="ORCID"
                hint={
                  form.orcid.trim() && !parseOrcidId(form.orcid) ? (
                    <span className="text-red-600">ORCID no válido</span>
                  ) : (
                    "El iD o la URL; se usa para importar publicaciones."
                  )
                }
              >
                <input
                  id="m-orcid"
                  type="text"
                  value={form.orcid}
                  placeholder="0000-0000-0000-0000"
                  onChange={(e) => set("orcid", e.target.value)}
                  className={cn(inputClass, "font-mono text-[13px]")}
                />
              </Field>
              <Field id="m-portal" label="Portal de Producción Científica (URL)">
                <input
                  id="m-portal"
                  type="url"
                  value={form.portalUrl}
                  placeholder="https://produccioncientifica.usal.es/investigadores/…"
                  onChange={(e) => set("portalUrl", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field id="m-scopus" label="Scopus (URL)">
                <input
                  id="m-scopus"
                  type="url"
                  value={form.scopus}
                  placeholder="https://www.scopus.com/authid/detail.uri?authorId=…"
                  onChange={(e) => set("scopus", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field id="m-scholar" label="Google Scholar (URL)">
                <input
                  id="m-scholar"
                  type="url"
                  value={form.scholar}
                  placeholder="https://scholar.google.com/citations?user=…"
                  onChange={(e) => set("scholar", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field id="m-website" label="Web personal u otro perfil (URL)">
                <input
                  id="m-website"
                  type="url"
                  value={form.website}
                  placeholder="https://…"
                  onChange={(e) => set("website", e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <CheckboxField
              checked={form.active}
              onChange={(active) => set("active", active)}
              label="Visible en la web"
            />

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <Button variant="ghost" onClick={() => setForm(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
