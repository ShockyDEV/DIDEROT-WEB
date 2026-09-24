"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const inputClass =
  "h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25";
const labelClass = "text-[13px] font-medium text-gray-700";

export interface SiteData {
  name: string;
  email: string;
  phone: string;
  reservasUrl: string;
  seoDescription: string;
}

export interface AccountRow {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface SettingsSectionProps {
  site: SiteData;
  accounts: AccountRow[];
  isSuperAdmin: boolean;
}

export function SettingsSection({
  site: initialSite,
  accounts,
  isSuperAdmin,
}: Readonly<SettingsSectionProps>) {
  const router = useRouter();
  const [site, setSite] = useState(initialSite);
  const [savingSite, setSavingSite] = useState(false);
  const [newAccount, setNewAccount] = useState({
    email: "",
    name: "",
    password: "",
    role: "ADMIN" as "ADMIN" | "SUPER_ADMIN",
  });
  const [creating, setCreating] = useState(false);

  async function saveSite() {
    setSavingSite(true);
    try {
      const entries: Array<[string, string]> = [
        ["name", site.name],
        ["email", site.email],
        ["phone", site.phone],
        ["reservas-url", site.reservasUrl],
        ["seo-description", site.seoDescription],
      ];
      for (const [blockKey, content] of entries) {
        const res = await fetch("/api/admin/content-blocks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageSlug: "_site", blockKey, content }),
        });
        if (!res.ok) throw new Error("No se pudo guardar");
      }
      toast.success("Datos del sitio guardados");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSavingSite(false);
    }
  }

  async function createAccount() {
    if (!newAccount.email || !newAccount.name || !newAccount.password) {
      toast.error("Completa correo, nombre y contraseña");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAccount),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "No se pudo crear la cuenta");
      toast.success(`Cuenta creada: ${newAccount.email}`);
      setNewAccount({ email: "", name: "", password: "", role: "ADMIN" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex max-w-[760px] flex-col gap-6">
      {/* Datos del sitio */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 pt-6">
          <h3 className="text-base font-semibold text-gray-900">
            Datos del sitio
          </h3>
        </div>
        <div className="flex flex-col gap-4 px-6 pb-6 pt-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="s-name" className={labelClass}>
                Nombre del sitio
              </label>
              <input
                id="s-name"
                type="text"
                value={site.name}
                onChange={(e) => setSite({ ...site, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="s-mail" className={labelClass}>
                Correo de contacto
              </label>
              <input
                id="s-mail"
                type="email"
                value={site.email}
                onChange={(e) => setSite({ ...site, email: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="s-phone" className={labelClass}>
                Teléfono
              </label>
              <input
                id="s-phone"
                type="text"
                value={site.phone}
                onChange={(e) => setSite({ ...site, phone: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="s-res" className={labelClass}>
                URL de reservas
              </label>
              <input
                id="s-res"
                type="text"
                value={site.reservasUrl}
                onChange={(e) =>
                  setSite({ ...site, reservasUrl: e.target.value })
                }
                className={cn(inputClass, "text-gray-600")}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="s-desc" className={labelClass}>
              Descripción (SEO)
            </label>
            <textarea
              id="s-desc"
              rows={2}
              value={site.seoDescription}
              onChange={(e) =>
                setSite({ ...site, seoDescription: e.target.value })
              }
              className="resize-y rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25"
            />
          </div>
          <div className="flex border-t border-gray-100 pt-4">
            <Button variant="primary" onClick={saveSite} disabled={savingSite}>
              {savingSite ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </div>

      {/* Cuentas autorizadas */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 pt-6">
          <h3 className="mb-1 text-base font-semibold text-gray-900">
            Cuentas autorizadas
          </h3>
          <p className="text-[13px] text-gray-500">
            Solo estas cuentas pueden iniciar sesión en el panel, con su usuario
            y contraseña. Las altas las gestiona la persona con rol Super
            Administradora.
          </p>
        </div>
        <div className="flex flex-col gap-2.5 px-6 pb-6 pt-5">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{a.email}</p>
                <p className="text-xs text-gray-500">{a.name}</p>
              </div>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                  a.role === "SUPER_ADMIN"
                    ? "bg-[#FEF2F2] text-diderot-amber"
                    : "bg-gray-100 text-gray-700",
                )}
              >
                {a.role === "SUPER_ADMIN"
                  ? "Super Administración"
                  : "Administración"}
              </span>
            </div>
          ))}

          {isSuperAdmin ? (
            <div className="mt-2 flex flex-col gap-2.5 border-t border-gray-100 pt-4">
              <p className={labelClass}>Crear cuenta</p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <input
                  type="email"
                  placeholder="nueva-cuenta@usal.es"
                  aria-label="Correo de la nueva cuenta"
                  value={newAccount.email}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, email: e.target.value })
                  }
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Nombre y apellidos"
                  aria-label="Nombre de la nueva cuenta"
                  value={newAccount.name}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, name: e.target.value })
                  }
                  className={inputClass}
                />
                <input
                  type="password"
                  placeholder="Contraseña (mín. 8 caracteres)"
                  aria-label="Contraseña de la nueva cuenta"
                  value={newAccount.password}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, password: e.target.value })
                  }
                  className={inputClass}
                />
                <select
                  aria-label="Rol de la nueva cuenta"
                  value={newAccount.role}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      role: e.target.value as "ADMIN" | "SUPER_ADMIN",
                    })
                  }
                  className={inputClass}
                >
                  <option value="ADMIN">Administración</option>
                  <option value="SUPER_ADMIN">Super Administración</option>
                </select>
              </div>
              <div>
                <Button
                  variant="outline"
                  onClick={createAccount}
                  disabled={creating}
                >
                  {creating ? "Creando…" : "Crear cuenta"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
              Solo la cuenta con rol Super Administración puede crear cuentas
              nuevas.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
