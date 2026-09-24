import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { SignInForm } from "@/components/auth/signin-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <div className="theme-light flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="flex w-full max-w-[420px] flex-col gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <Image
              src="/images/diderot-logo.png"
              alt="DIDEROT — Didácticas Digitales de la Expresión Musical y las Artes Performativas"
              width={1023}
              height={295}
              priority
              className="mb-4 h-12 w-auto"
            />
            <h1 className="mb-1 text-xl font-bold text-diderot-indigo">
              Panel de administración
            </h1>
            <p className="text-[13px] text-gray-500">
              Gestión de contenidos de la web del grupo DIDEROT
            </p>
          </div>

          <Suspense>
            <SignInForm />
          </Suspense>

          <div className="mt-5 flex items-start gap-2.5 border-t border-gray-100 pt-[18px]">
            <ShieldCheck
              className="mt-px h-4 w-4 flex-none text-diderot-amber"
              aria-hidden="true"
            />
            <p className="text-xs leading-normal text-gray-500">
              Acceso restringido a las cuentas autorizadas por la administración del
              grupo. Disponer de una cuenta <strong className="text-gray-700">@usal.es</strong>{" "}
              no da acceso al panel.
            </p>
          </div>
        </div>

        <Link href="/" className="text-center text-[13px] text-gray-500 hover:text-gray-700">
          ← Volver a la web de DIDEROT
        </Link>
      </div>
    </div>
  );
}
