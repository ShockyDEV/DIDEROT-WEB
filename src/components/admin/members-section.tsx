"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Search, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/admin/modal";
import { cn } from "@/lib/cn";

const inputClass =
  "h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25";
const labelClass = "text-[13px] font-medium text-gray-700";

export interface MemberRow {
  id: string;
  name: string;
  area: string | null;
  email: string | null;
  extension: string | null;
  role: string | null;
  photo: string | null;
  portalUrl: string | null;
  orcid: string | null;
  scopus: string | null;
  active: boolean;
  order: number;
  groupId: string | null;
  groupAcronym: string | null;
}

export interface GroupOption {
  id: string;
  acronym: string;
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

interface FormState {
  id?: string;
  name: string;
  area: string;
  email: string;
  extension: string;
  role: string;
  photo: string;
  portalUrl: string;
  orcid: string;
  scopus: string;
  order: number;
  groupId: string;
  active: boolean;
}

const EMPTY: FormState = {
  name: "",
  area: "",
  email: "",
  extension: "",
  role: "",
  photo: "",
  portalUrl: "",
  orcid: "",
  scopus: "",
  order: 0,
  groupId: "",
  active: true,
};

export function MembersSection({
  rows,
  groups,
}: Readonly<{ rows: MemberRow[]; groups: GroupOption[] }>) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [gallery, setGallery] = useState<{ url: string; name: string }[] | null>(
    null,
  );
  const [galleryLoading, setGalleryLoading] = useState(false);

  async function toggleGallery() {
    const next = !galleryOpen;
    setGalleryOpen(next);
    if (next && gallery === null) {
      setGalleryLoading(true);
      try {
        const res = await fetch("/api/admin/members/photos");
        const json = await res.json().catch(() => ({}));
        setGallery(json.images ?? []);
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
      const res = await fetch("/api/admin/members/photo", {
        method: "POST",
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "No se pudo subir la foto");
      setForm((f) => (f ? { ...f, photo: json.photo } : f));
      setGallery(null); // que la galería incluya la recién subida al reabrir
      toast.success("Foto subida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir la foto");
    } finally {
      setUploading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.area ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  // El equipo (quienes tienen cargo: dirección y administración) se gestiona
  // separado del resto de miembros.
  const equipo = useMemo(() => filtered.filter((r) => r.role), [filtered]);
  const miembros = useMemo(() => filtered.filter((r) => !r.role), [filtered]);

  function openEdit(row: MemberRow) {
    setForm({
      id: row.id,
      name: row.name,
      area: row.area ?? "",
      email: row.email ?? "",
      extension: row.extension ?? "",
      role: row.role ?? "",
      photo: row.photo ?? "",
      portalUrl: row.portalUrl ?? "",
      orcid: row.orcid ?? "",
      scopus: row.scopus ?? "",
      order: row.order,
      groupId: row.groupId ?? "",
      active: row.active,
    });
  }

  async function handleSave() {
    if (!form) return;
    if (form.name.trim().length < 2) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        area: form.area || null,
        email: form.email || null,
        extension: form.extension || null,
        role: form.role || null,
        photo: form.photo || null,
        portalUrl: form.portalUrl || "",
        orcid: form.orcid || "",
        scopus: form.scopus || "",
        order: form.order,
        groupId: form.groupId || null,
        active: form.active,
      };
      const res = await fetch(
        form.id ? `/api/admin/members/${form.id}` : "/api/admin/members",
        {
          method: form.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "No se pudo guardar");
      toast.success("Guardado");
      setForm(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: MemberRow) {
    if (!window.confirm(`¿Eliminar a «${row.name}»?`)) return;
    const res = await fetch(`/api/admin/members/${row.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("No se pudo eliminar");
      return;
    }
    toast.success("Miembro eliminado");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex h-10 w-[300px] items-center gap-2 rounded-md border border-gray-300 bg-white px-3">
          <Search className="h-[15px] w-[15px] text-gray-500" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o área…"
            className="min-w-0 flex-1 border-none bg-transparent text-sm text-gray-900 outline-none"
          />
        </div>
        <Button variant="primary" onClick={() => setForm(EMPTY)}>
          + Nuevo miembro
        </Button>
      </div>

      {[
        {
          titulo: "Equipo de dirección y administración",
          descripcion:
            "Miembros con cargo (Directora, Subdirector, Secretaría, personal técnico…). El cargo se asigna al editar la ficha.",
          subset: equipo,
          vacio: "Nadie con cargo asignado.",
        },
        {
          titulo: "Miembros",
          descripcion: null,
          subset: miembros,
          vacio: "Sin resultados.",
        },
      ].map(({ titulo, descripcion, subset, vacio }) => (
        <div
          key={titulo}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="p-6">
            <h3 className="text-base font-semibold text-gray-900">
              {titulo} ({subset.length})
            </h3>
            {descripcion ? (
              <p className="mt-1 text-[13px] text-gray-500">{descripcion}</p>
            ) : null}
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-t border-gray-100">
                <th scope="col" className="px-6 py-3 text-left text-[13px] font-medium text-gray-500">
                  Nombre
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                  Cargo / Área
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                  Email
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                  Estado
                </th>
                <th scope="col" className="w-[150px] px-6 py-3 text-left text-[13px] font-medium text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {subset.map((row) => (
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
                      <span className="text-sm font-medium text-gray-900">
                        {row.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-600">
                    {[row.role, row.area].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-500">
                    {row.email ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        row.active
                          ? "bg-[#DCFCE7] text-[#15803D]"
                          : "bg-gray-100 text-gray-700",
                      )}
                    >
                      {row.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Editar
                      </button>
                      <button
                        type="button"
                        aria-label={`Eliminar a ${row.name}`}
                        onClick={() => handleDelete(row)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {subset.length === 0 ? (
                <tr className="border-t border-gray-100">
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    {vacio}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ))}

      {form ? (
        <Modal
          title={form.id ? "Editar miembro" : "Nuevo miembro"}
          onClose={() => setForm(null)}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="m-name" className={labelClass}>
                Nombre y apellidos
              </label>
              <input
                id="m-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="m-role" className={labelClass}>
                  Cargo (opcional)
                </label>
                <input
                  id="m-role"
                  type="text"
                  value={form.role}
                  placeholder="Directora, Subdirector…"
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="m-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="m-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="m-ext" className={labelClass}>
                  Extensión telefónica (opcional)
                </label>
                <input
                  id="m-ext"
                  type="text"
                  value={form.extension}
                  placeholder="p. ej. 4634"
                  onChange={(e) =>
                    setForm({ ...form, extension: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="m-area" className={labelClass}>
                Área
              </label>
              <input
                id="m-area"
                type="text"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Foto</label>
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
                  <label
                    className={cn(
                      "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50",
                      uploading && "pointer-events-none opacity-60",
                    )}
                  >
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    {uploading
                      ? "Subiendo…"
                      : form.photo
                        ? "Cambiar foto"
                        : "Subir foto"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePhotoUpload(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={toggleGallery}
                    className="text-left text-xs font-medium text-diderot-violet hover:underline"
                  >
                    {galleryOpen
                      ? "Ocultar imágenes subidas"
                      : "Elegir de las imágenes ya subidas"}
                  </button>
                  {form.photo ? (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, photo: "" })}
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
                    <p className="p-3 text-center text-xs text-gray-500">
                      Cargando imágenes…
                    </p>
                  ) : gallery && gallery.length > 0 ? (
                    <div className="grid grid-cols-6 gap-2">
                      {gallery.map((img) => (
                        <button
                          key={img.url}
                          type="button"
                          title={img.name}
                          onClick={() => {
                            setForm({ ...form, photo: img.url });
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
                          <img
                            src={img.url}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="p-3 text-center text-xs text-gray-500">
                      No hay imágenes subidas todavía.
                    </p>
                  )}
                </div>
              ) : null}

              <input
                id="m-photo"
                type="text"
                value={form.photo}
                placeholder="…o pega una URL (/uploads/…)"
                onChange={(e) => setForm({ ...form, photo: e.target.value })}
                className={inputClass}
              />
              <p className="text-xs text-gray-500">
                Sube una imagen (se recorta a 512×512), elige una ya subida o
                pega una URL.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="m-portal" className={labelClass}>
                Perfil en el Portal de Investigación (URL)
              </label>
              <input
                id="m-portal"
                type="url"
                value={form.portalUrl}
                placeholder="https://produccioncientifica.usal.es/investigadores/…"
                onChange={(e) =>
                  setForm({ ...form, portalUrl: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="m-orcid" className={labelClass}>
                  ORCID (URL)
                </label>
                <input
                  id="m-orcid"
                  type="url"
                  value={form.orcid}
                  placeholder="https://orcid.org/0000-0000-0000-0000"
                  onChange={(e) => setForm({ ...form, orcid: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="m-scopus" className={labelClass}>
                  Scopus (URL)
                </label>
                <input
                  id="m-scopus"
                  type="url"
                  value={form.scopus}
                  placeholder="https://www.scopus.com/authid/detail.uri?authorId=…"
                  onChange={(e) => setForm({ ...form, scopus: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="m-group" className={labelClass}>
                  Grupo de investigación
                </label>
                <select
                  id="m-group"
                  value={form.groupId}
                  onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                  className={inputClass}
                >
                  <option value="">— Sin grupo —</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.acronym}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="m-order" className={labelClass}>
                  Orden
                </label>
                <input
                  id="m-order"
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={(e) =>
                    setForm({ ...form, order: Number(e.target.value) })
                  }
                  className={inputClass}
                />
              </div>
            </div>
            <label className="flex items-center gap-2.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 accent-diderot-indigo"
              />
              Miembro activo (visible en la web)
            </label>
            <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </Button>
              <Button variant="ghost" onClick={() => setForm(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
