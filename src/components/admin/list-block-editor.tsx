"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { ICON_NAMES, iconFor } from "@/lib/icon-map";
import type { ListBlockDef, ListItem } from "@/lib/content/list-blocks";
import { cn } from "@/lib/cn";

const inputClass =
  "h-9 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25";

interface ListBlockEditorProps {
  def: ListBlockDef;
  /** Elementos guardados (o los por defecto del registro). */
  initialItems: ListItem[];
}

function emptyItem(def: ListBlockDef): ListItem {
  return Object.fromEntries(
    def.fields.map((f) => [f.key, f.type === "check" ? false : ""]),
  );
}

/**
 * Editor genérico de listas estructuradas (Contenido → Páginas): filas con
 * campos según el registro, añadir/eliminar/reordenar y guardado como JSON
 * en ContentBlock (blockKey "list:…").
 */
export function ListBlockEditor({
  def,
  initialItems,
}: Readonly<ListBlockEditorProps>) {
  const [items, setItems] = useState<ListItem[]>(initialItems);
  const [savedJson, setSavedJson] = useState(JSON.stringify(initialItems));
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(items) !== savedJson;

  function update(index: number, key: string, value: string | boolean) {
    setItems((list) =>
      list.map((it, i) => (i === index ? { ...it, [key]: value } : it)),
    );
  }

  function move(index: number, delta: number) {
    setItems((list) => {
      const next = [...list];
      const target = index + delta;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(index: number) {
    setItems((list) => list.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const content = JSON.stringify(items);
      const res = await fetch("/api/admin/content-blocks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug: def.pageSlug,
          blockKey: def.blockKey,
          content,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "No se pudo guardar");
      setSavedJson(content);
      toast.success("Lista guardada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-semibold text-gray-900">
            {def.title}
          </h3>
          {dirty ? (
            <span
              title="Cambios sin guardar"
              className="inline-block h-2 w-2 rounded-full bg-[#FBBF24]"
            />
          ) : null}
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-gray-500">
            {items.length} elementos
          </span>
          {JSON.stringify(items) !== JSON.stringify(def.defaultItems) ? (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "¿Restablecer esta lista a sus valores originales? (Tendrás que pulsar Guardar para publicarla.)",
                  )
                ) {
                  setItems(def.defaultItems);
                  toast("Lista original restaurada: revisa y pulsa Guardar", {
                    icon: "↩️",
                  });
                }
              }}
              title="Volver a los valores originales de esta lista"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 transition-colors hover:text-gray-700"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Restablecer original
            </button>
          ) : null}
          <Button
            variant={dirty ? "primary" : "outline"}
            size="sm"
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-6 pb-5">
        {items.map((item, index) => {
          const IconPreview = iconFor(item.icon as string | undefined);
          return (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3.5"
            >
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  {def.itemLabel} {index + 1}
                </p>
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    aria-label="Subir"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-200 disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Bajar"
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-200 disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Eliminar"
                    onClick={() => remove(index)}
                    className="flex h-7 w-7 items-center justify-center rounded text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {def.fields.map((field) => {
                  const value = item[field.key];
                  const id = `${def.blockKey}-${index}-${field.key}`;
                  return (
                    <div
                      key={field.key}
                      className={cn(
                        "flex flex-col gap-1",
                        field.type === "textarea" && "sm:col-span-2",
                      )}
                    >
                      <label
                        htmlFor={id}
                        className="text-[11px] font-medium text-gray-600"
                      >
                        {field.label}
                        {field.hint ? (
                          <span className="font-normal text-gray-500">
                            {" "}
                            — {field.hint}
                          </span>
                        ) : null}
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          id={id}
                          rows={2}
                          value={String(value ?? "")}
                          onChange={(e) =>
                            update(index, field.key, e.target.value)
                          }
                          className="w-full resize-y rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25"
                        />
                      ) : field.type === "check" ? (
                        <label className="flex h-9 items-center gap-2 text-sm text-gray-700">
                          <input
                            id={id}
                            type="checkbox"
                            checked={Boolean(value)}
                            onChange={(e) =>
                              update(index, field.key, e.target.checked)
                            }
                            className="h-4 w-4 accent-diderot-indigo"
                          />
                          Sí
                        </label>
                      ) : field.type === "icon" ? (
                        <div className="flex items-center gap-2">
                          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-gray-200 bg-white text-ink">
                            <IconPreview
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </span>
                          <input
                            id={id}
                            type="text"
                            list="lucide-icons"
                            value={String(value ?? "")}
                            onChange={(e) =>
                              update(index, field.key, e.target.value)
                            }
                            className={inputClass}
                          />
                        </div>
                      ) : (
                        <input
                          id={id}
                          type={field.type === "url" ? "text" : "text"}
                          value={String(value ?? "")}
                          onChange={(e) =>
                            update(index, field.key, e.target.value)
                          }
                          className={inputClass}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setItems((l) => [...l, emptyItem(def)])}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Añadir {def.itemLabel}
          </Button>
        </div>

        {/* Sugerencias de iconos compartidas por todos los campos icon */}
        <datalist id="lucide-icons">
          {ICON_NAMES.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
