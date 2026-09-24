"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/admin/modal";
import {
  Field,
  IconButton,
  inputClass,
  labelClass,
  textareaClass,
} from "@/components/admin/form-fields";
import { errorMessage, sendJson } from "@/components/admin/admin-fetch";
import type { SiteSettings } from "@/lib/site-settings";
import { cn } from "@/lib/cn";

/** Mínimo de la contraseña (igual que MIN_PASSWORD_LENGTH del servidor). */
const MIN_PASSWORD = 12;

export interface AccountRow {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Administración",
  ADMIN: "Administración",
};

interface SettingsSectionProps {
  site: SiteSettings;
  accounts: AccountRow[];
  currentUserId: string;
  isSuperAdmin: boolean;
}

function Card({
  title,
  description,
  children,
}: Readonly<{ title: string; description?: React.ReactNode; children: React.ReactNode }>) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="px-6 pt-6">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description ? <p className="mt-1 text-[13px] text-gray-500">{description}</p> : null}
      </div>
      <div className="flex flex-col gap-4 px-6 pb-6 pt-5">{children}</div>
    </div>
  );
}

export function SettingsSection({
  site: initialSite,
  accounts,
  currentUserId,
  isSuperAdmin,
}: Readonly<SettingsSectionProps>) {
  const router = useRouter();

  /* ── Datos del sitio ── */
  const [site, setSite] = useState(initialSite);
  const [savingSite, setSavingSite] = useState(false);

  async function saveSite() {
    setSavingSite(true);
    try {
      await sendJson("/api/admin/site-settings", "PUT", site);
      toast.success("Datos del sitio guardados");
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo guardar"));
    } finally {
      setSavingSite(false);
    }
  }

  /* ── Mi contraseña ── */
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPwd, setSavingPwd] = useState(false);
  const pwdMismatch = pwd.confirmPassword !== "" && pwd.newPassword !== pwd.confirmPassword;

  async function changePassword() {
    if (!pwd.currentPassword) {
      toast.error("Escribe tu contraseña actual");
      return;
    }
    if (pwd.newPassword.length < MIN_PASSWORD) {
      toast.error(`La contraseña nueva debe tener al menos ${MIN_PASSWORD} caracteres`);
      return;
    }
    if (pwd.newPassword !== pwd.confirmPassword) {
      toast.error("Las dos contraseñas nuevas no coinciden");
      return;
    }
    setSavingPwd(true);
    try {
      await sendJson("/api/admin/me/password", "POST", pwd);
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
      // El cambio cierra todas las sesiones de la cuenta (también esta).
      toast.success("Contraseña cambiada. Vuelve a entrar con la nueva.");
      setTimeout(() => signOut({ callbackUrl: "/auth/signin" }), 1500);
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo cambiar la contraseña"));
    } finally {
      setSavingPwd(false);
    }
  }

  /* ── Cuentas (solo SUPER_ADMIN) ── */
  const [newAccount, setNewAccount] = useState({
    email: "",
    name: "",
    password: "",
    role: "ADMIN" as "ADMIN" | "SUPER_ADMIN",
  });
  const [creating, setCreating] = useState(false);
  const [resetFor, setResetFor] = useState<AccountRow | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [busyAccount, setBusyAccount] = useState<string | null>(null);
  const superCount = accounts.filter((a) => a.role === "SUPER_ADMIN").length;

  async function createAccount() {
    if (!newAccount.email || !newAccount.name || !newAccount.password) {
      toast.error("Completa correo, nombre y contraseña");
      return;
    }
    if (newAccount.password.length < MIN_PASSWORD) {
      toast.error(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`);
      return;
    }
    setCreating(true);
    try {
      await sendJson("/api/admin/accounts", "POST", newAccount);
      toast.success(`Cuenta creada: ${newAccount.email}`);
      setNewAccount({ email: "", name: "", password: "", role: "ADMIN" });
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo crear la cuenta"));
    } finally {
      setCreating(false);
    }
  }

  async function changeRole(account: AccountRow, role: string) {
    if (role === account.role) return;
    if (
      account.id === currentUserId &&
      role === "ADMIN" &&
      !window.confirm("Vas a quitarte el rol de Super Administración. ¿Seguro?")
    ) {
      return;
    }
    setBusyAccount(account.id);
    try {
      await sendJson(`/api/admin/accounts/${account.id}`, "PATCH", { role });
      toast.success(`Rol actualizado: ${ROLE_LABELS[role] ?? role}`);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo cambiar el rol"));
    } finally {
      setBusyAccount(null);
    }
  }

  async function deleteAccount(account: AccountRow) {
    if (!window.confirm(`¿Eliminar la cuenta ${account.email}? Ya no podrá entrar al panel.`)) {
      return;
    }
    setBusyAccount(account.id);
    try {
      await sendJson(`/api/admin/accounts/${account.id}`, "DELETE");
      toast.success("Cuenta eliminada");
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo eliminar la cuenta"));
    } finally {
      setBusyAccount(null);
    }
  }

  async function saveResetPassword() {
    if (!resetFor) return;
    if (resetPassword.length < MIN_PASSWORD) {
      toast.error(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`);
      return;
    }
    setBusyAccount(resetFor.id);
    try {
      await sendJson(`/api/admin/accounts/${resetFor.id}`, "PATCH", { password: resetPassword });
      toast.success(`Contraseña nueva fijada para ${resetFor.email}`);
      setResetFor(null);
      setResetPassword("");
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo cambiar la contraseña"));
    } finally {
      setBusyAccount(null);
    }
  }

  return (
    <div className="flex max-w-[820px] flex-col gap-6">
      {/* Datos del sitio */}
      <Card
        title="Datos del sitio"
        description="Nombre, contacto y descripción para buscadores. Si se dejan como están, se usan los valores por defecto de la web."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="s-name" label="Nombre del sitio" className="sm:col-span-2">
            <input
              id="s-name"
              type="text"
              value={site.name}
              onChange={(e) => setSite({ ...site, name: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field id="s-mail" label="Correo de contacto">
            <input
              id="s-mail"
              type="email"
              value={site.email}
              onChange={(e) => setSite({ ...site, email: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field id="s-phone" label="Teléfono (opcional)">
            <input
              id="s-phone"
              type="tel"
              value={site.phone}
              placeholder="+34 923 …"
              onChange={(e) => setSite({ ...site, phone: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
        <Field
          id="s-desc"
          label="Descripción (SEO)"
          hint={`${site.seoDescription.length}/320 caracteres · la muestran Google y las redes al compartir la web`}
        >
          <textarea
            id="s-desc"
            rows={3}
            maxLength={320}
            value={site.seoDescription}
            onChange={(e) => setSite({ ...site, seoDescription: e.target.value })}
            className={textareaClass}
          />
        </Field>
        <div className="flex border-t border-gray-100 pt-4">
          <Button variant="primary" onClick={saveSite} disabled={savingSite}>
            {savingSite ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </Card>

      {/* Mi contraseña */}
      <Card
        title="Cambiar mi contraseña"
        description={`Mínimo ${MIN_PASSWORD} caracteres. Mejor una frase larga que no uses en otros sitios.`}
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void changePassword();
          }}
        >
          {/* Ayuda a los gestores de contraseñas a asociarla a la cuenta */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            hidden
            readOnly
            value={accounts.find((a) => a.id === currentUserId)?.email ?? ""}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field id="pwd-current" label="Contraseña actual">
              <input
                id="pwd-current"
                type="password"
                autoComplete="current-password"
                value={pwd.currentPassword}
                onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field
              id="pwd-new"
              label="Contraseña nueva"
              hint={
                pwd.newPassword && pwd.newPassword.length < MIN_PASSWORD
                  ? `Faltan ${MIN_PASSWORD - pwd.newPassword.length} caracteres`
                  : undefined
              }
            >
              <input
                id="pwd-new"
                type="password"
                autoComplete="new-password"
                value={pwd.newPassword}
                onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field
              id="pwd-confirm"
              label="Repite la nueva"
              hint={pwdMismatch ? <span className="text-red-600">No coinciden</span> : undefined}
            >
              <input
                id="pwd-confirm"
                type="password"
                autoComplete="new-password"
                value={pwd.confirmPassword}
                onChange={(e) => setPwd({ ...pwd, confirmPassword: e.target.value })}
                className={cn(inputClass, pwdMismatch && "border-red-400")}
              />
            </Field>
          </div>
          <div className="flex border-t border-gray-100 pt-4">
            <Button type="submit" variant="primary" disabled={savingPwd} className="gap-1.5">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              {savingPwd ? "Cambiando…" : "Cambiar contraseña"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Cuentas autorizadas */}
      <Card
        title="Cuentas autorizadas"
        description="Solo estas cuentas pueden iniciar sesión en el panel. Las altas, bajas y cambios de rol los gestiona la Super Administración; siempre queda al menos una cuenta con ese rol."
      >
        <div className="flex flex-col gap-2.5">
          {accounts.map((a) => {
            const isMe = a.id === currentUserId;
            const lastSuper = a.role === "SUPER_ADMIN" && superCount <= 1;
            return (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {a.email}
                    {isMe ? (
                      <span className="ml-2 rounded-full bg-diderot-pale px-2 py-px text-[11px] font-semibold text-diderot-indigo">
                        Tú
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-gray-500">
                    {a.name} · alta el {new Date(a.createdAt).toLocaleDateString("es-ES")}
                  </p>
                </div>
                {isSuperAdmin ? (
                  <div className="flex items-center gap-1.5">
                    <select
                      aria-label={`Rol de ${a.email}`}
                      value={a.role}
                      disabled={busyAccount === a.id || lastSuper}
                      title={lastSuper ? "Es la única cuenta de Super Administración" : undefined}
                      onChange={(e) => changeRole(a, e.target.value)}
                      className={cn(inputClass, "h-8 w-auto text-[13px]")}
                    >
                      <option value="ADMIN">Administración</option>
                      <option value="SUPER_ADMIN">Super Administración</option>
                    </select>
                    {!isMe ? (
                      <>
                        <IconButton
                          label={`Fijar contraseña nueva para ${a.email}`}
                          onClick={() => {
                            setResetFor(a);
                            setResetPassword("");
                          }}
                        >
                          <KeyRound className="h-4 w-4" aria-hidden="true" />
                        </IconButton>
                        <IconButton
                          label={`Eliminar la cuenta ${a.email}`}
                          danger
                          disabled={busyAccount === a.id || lastSuper}
                          onClick={() => deleteAccount(a)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </IconButton>
                      </>
                    ) : null}
                  </div>
                ) : (
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                      a.role === "SUPER_ADMIN"
                        ? "bg-diderot-amber/10 text-diderot-amber"
                        : "bg-gray-100 text-gray-700",
                    )}
                  >
                    {ROLE_LABELS[a.role] ?? a.role}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {isSuperAdmin ? (
          <form
            className="mt-2 flex flex-col gap-2.5 border-t border-gray-100 pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              void createAccount();
            }}
          >
            <p className={labelClass}>Crear cuenta</p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <input
                type="email"
                placeholder="nueva-cuenta@usal.es"
                aria-label="Correo de la nueva cuenta"
                autoComplete="off"
                value={newAccount.email}
                onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Nombre y apellidos"
                aria-label="Nombre de la nueva cuenta"
                autoComplete="off"
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                className={inputClass}
              />
              <input
                type="password"
                placeholder={`Contraseña (mín. ${MIN_PASSWORD} caracteres)`}
                aria-label="Contraseña de la nueva cuenta"
                autoComplete="new-password"
                value={newAccount.password}
                onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
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
              <Button type="submit" variant="outline" disabled={creating}>
                {creating ? "Creando…" : "Crear cuenta"}
              </Button>
            </div>
          </form>
        ) : (
          <p className="mt-2 flex items-start gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
            <ShieldCheck className="mt-px h-4 w-4 flex-none text-diderot-amber" aria-hidden="true" />
            Solo las cuentas con rol de Super Administración pueden crear, eliminar o
            cambiar el rol de las cuentas.
          </p>
        )}
      </Card>

      {resetFor ? (
        <Modal title={`Contraseña nueva para ${resetFor.email}`} onClose={() => setResetFor(null)}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void saveResetPassword();
            }}
          >
            <p className="text-sm text-gray-600">
              Úsalo si esa persona ha olvidado su contraseña. Comunícale la nueva por un
              canal seguro y pídele que la cambie desde «Cambiar mi contraseña».
            </p>
            <Field id="reset-pwd" label={`Contraseña nueva (mín. ${MIN_PASSWORD} caracteres)`}>
              <input
                id="reset-pwd"
                type="password"
                autoComplete="new-password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className={inputClass}
              />
            </Field>
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <Button variant="ghost" onClick={() => setResetFor(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={busyAccount === resetFor.id}>
                Guardar contraseña
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
