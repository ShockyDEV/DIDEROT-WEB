"use client";

import { useRef, useState } from "react";
import { FileText, ImageOff, Loader2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/cn";
import { ACCEPT_IMAGE_UPLOAD, type UploadFolder } from "@/lib/admin-options";
import { errorMessage, uploadFile } from "@/components/admin/admin-fetch";

/**
 * Piezas comunes de los formularios del panel (mismo aspecto que el resto
 * de secciones heredadas del IUCE: campos de 40 px, etiqueta de 13 px).
 */

export const inputClass =
  "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25 disabled:bg-gray-50 disabled:text-gray-500";

export const textareaClass =
  "w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25";

export const labelClass = "text-[13px] font-medium text-gray-700";

export const hintClass = "text-xs text-gray-500";

/** Etiqueta + control + ayuda opcional. */
export function Field({
  id,
  label,
  hint,
  className,
  children,
}: Readonly<{
  id?: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}>) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {id ? (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      ) : (
        <span className={labelClass}>{label}</span>
      )}
      {children}
      {hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  );
}

/** Casilla con texto (y explicación opcional debajo). */
export function CheckboxField({
  checked,
  onChange,
  label,
  hint,
}: Readonly<{
  checked: boolean;
  onChange: (value: boolean) => void;
  label: React.ReactNode;
  hint?: React.ReactNode;
}>) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 flex-none accent-diderot-indigo"
      />
      <span>
        {label}
        {hint ? <span className="mt-0.5 block text-xs text-gray-500">{hint}</span> : null}
      </span>
    </label>
  );
}

/**
 * Imagen de un registro (cartel, logotipo, portada): subir a Archivos
 * (solo imágenes, validadas y recodificadas en el servidor), quitarla o
 * pegar una URL (/uploads/… o https://…).
 */
export function ImageUploadField({
  id,
  label,
  value,
  onChange,
  folder,
  hint,
  wide = true,
}: Readonly<{
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (url: string) => void;
  folder: UploadFolder;
  hint?: React.ReactNode;
  /** Vista previa apaisada (carteles) o cuadrada (logotipos). */
  wide?: boolean;
}>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const item = await uploadFile(file, { only: "image", folder });
      onChange(item.url);
      toast.success("Imagen subida");
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo subir la imagen"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Field id={id} label={label} hint={hint}>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className={cn(
              "flex-none rounded-md border border-gray-200 bg-gray-50 object-cover",
              wide ? "h-16 w-24" : "h-16 w-16 object-contain",
            )}
          />
        ) : (
          <span
            className={cn(
              "flex flex-none items-center justify-center rounded-md border border-dashed border-gray-300 text-gray-400",
              wide ? "h-16 w-24" : "h-16 w-16",
            )}
          >
            <ImageOff className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Sin imagen</span>
          </span>
        )}
        <div className="flex flex-col items-start gap-1.5">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="h-4 w-4" aria-hidden="true" />
            )}
            {uploading ? "Subiendo…" : value ? "Cambiar imagen" : "Subir imagen"}
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-left text-xs text-red-600 hover:underline"
            >
              Quitar imagen
            </button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_IMAGE_UPLOAD}
          className="hidden"
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…o pega una dirección (/uploads/… o https://…)"
        className={cn(inputClass, "text-[13px] text-gray-600")}
      />
    </Field>
  );
}

/**
 * Documento PDF (p. ej. el programa de un evento): se sube a Archivos o se
 * pega su dirección (/uploads/…, /docs/… o https://…).
 */
export function DocumentUploadField({
  id,
  label,
  value,
  onChange,
  folder,
  hint,
}: Readonly<{
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (url: string) => void;
  folder: UploadFolder;
  hint?: React.ReactNode;
}>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const item = await uploadFile(file, { only: "document", folder });
      onChange(item.url);
      toast.success("Documento subido");
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo subir el documento"));
    } finally {
      setUploading(false);
    }
  }

  const fileName = value ? decodeURIComponent(value.split("/").pop() ?? value) : "";

  return (
    <Field id={id} label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-16 w-16 flex-none items-center justify-center rounded-md border",
            value
              ? "border-gray-200 bg-diderot-pale text-diderot-indigo"
              : "border-dashed border-gray-300 text-gray-400",
          )}
        >
          <FileText className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          {value ? (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="max-w-full truncate text-[13px] font-medium text-diderot-violet hover:underline"
            >
              {fileName}
            </a>
          ) : null}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="h-4 w-4" aria-hidden="true" />
              )}
              {uploading ? "Subiendo…" : value ? "Cambiar PDF" : "Subir PDF"}
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-xs text-red-600 hover:underline"
              >
                Quitar
              </button>
            ) : null}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…o pega una dirección (/uploads/…, /docs/… o https://…)"
        className={cn(inputClass, "text-[13px] text-gray-600")}
      />
    </Field>
  );
}

/** Botón de icono de la columna Acciones de las tablas. */
export function IconButton({
  label,
  onClick,
  danger,
  pressed,
  disabled,
  children,
}: Readonly<{
  label: string;
  onClick: () => void;
  danger?: boolean;
  pressed?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-40",
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
      )}
    >
      {children}
    </button>
  );
}
