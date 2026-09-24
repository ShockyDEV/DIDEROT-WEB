import { z } from "zod";

/** Asuntos disponibles en el formulario de contacto (select del prototipo). */
export const CONTACT_SUBJECTS = [
  "Formación del profesorado",
  "Investigación y grupos",
  "Doctorado",
  "Reserva de espacios",
  "Revista EKS",
  "Otro",
] as const;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Indica tu nombre y apellidos")
    .max(120, "El nombre es demasiado largo"),
  email: z.string().trim().email("Correo electrónico no válido").max(200),
  subject: z.enum(CONTACT_SUBJECTS, {
    errorMap: () => ({ message: "Selecciona un asunto" }),
  }),
  message: z
    .string()
    .trim()
    .min(10, "Cuéntanos tu consulta (mínimo 10 caracteres)")
    .max(5000, "El mensaje es demasiado largo"),
  gdpr: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar la política de privacidad" }),
  }),
});

export type ContactInput = z.infer<typeof contactSchema>;
