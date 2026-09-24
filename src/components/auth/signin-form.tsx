"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

const inputClass =
  "h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25";

/**
 * Formulario de acceso al panel. Autenticación con Credentials
 * (email + contraseña); en caso de éxito redirige al callbackUrl o /backstage.
 */
export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const data = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: data.get("email"),
      password: data.get("password"),
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError("Credenciales no válidas. Comprueba el correo y la contraseña.");
      return;
    }
    router.push(searchParams.get("callbackUrl") ?? "/backstage");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-md border border-danger-500/30 bg-danger-50 px-3 py-2.5 text-sm text-danger-700"
        >
          {error}
        </p>
      ) : null}

      <div className="mb-4 flex flex-col gap-2">
        <label
          htmlFor="admin-email"
          className="text-[13px] font-medium text-gray-700"
        >
          Correo electrónico
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          placeholder="tu@usal.es"
          autoComplete="email"
          className={inputClass}
        />
      </div>

      <div className="mb-5 flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label
            htmlFor="admin-pass"
            className="text-[13px] font-medium text-gray-700"
          >
            Contraseña
          </label>
          <a
            href="mailto:iuce.tecnico@usal.es?subject=Restablecer%20contrase%C3%B1a%20del%20panel"
            title="Escribe al soporte técnico para restablecerla"
            className="text-xs text-diderot-violet hover:underline"
          >
            ¿Has olvidado tu contraseña?
          </a>
        </div>
        <input
          id="admin-pass"
          name="password"
          type="password"
          required
          placeholder="••••••••"
          autoComplete="current-password"
          className={inputClass}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Comprobando…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
