"use client";

import { Toaster } from "react-hot-toast";

/**
 * Contenedor de notificaciones (toasts) arriba a la derecha, con el mismo
 * estilo que la web del IUCE, de la que parte esta.
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          fontSize: "14px",
          borderRadius: "8px",
        },
      }}
    />
  );
}
