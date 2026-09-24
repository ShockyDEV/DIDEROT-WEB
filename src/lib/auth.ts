import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import * as bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { authConfig } from "@/auth.config";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(256),
});

/**
 * Hash de relleno (de una contraseña aleatoria que no se guarda): si el
 * correo no existe se compara igualmente contra él, para que el tiempo de
 * respuesta no delate qué correos tienen cuenta en el panel.
 */
const DUMMY_HASH = "$2a$12$kSt7NgcKEZ1o88dIyTONM.It1icEPzsbTZz4lWBYZi8EJVDU.ZTkC";

/** Coste de bcrypt vigente: los hashes más débiles se renuevan al entrar. */
const BCRYPT_COST = 12;

/**
 * NextAuth v5 con provider Credentials (email + contraseña).
 *
 * Decisión del proyecto (heredada de la web del IUCE): NO hay magic link ni
 * auto-registro. Solo pueden entrar las cuentas dadas de alta por el rol
 * SUPER_ADMIN desde Configuración. Hash de contraseñas con bcrypt.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "DIDEROT",
      credentials: {
        email: { label: "Correo electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Anti fuerza bruta: 5 intentos por correo y 15 por IP cada 5 min.
        const ip = clientIp(request);
        if (
          !rateLimit(`login:mail:${email}`, 5, 5 * 60_000) ||
          !rateLimit(`login:ip:${ip}`, 15, 5 * 60_000)
        ) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !valid) return null;

        // Cuentas creadas con un coste menor (p. ej. por la semilla): se
        // aprovecha que ahora se conoce la contraseña para reforzar el hash.
        if (bcrypt.getRounds(user.passwordHash) < BCRYPT_COST) {
          await prisma.user
            .update({
              where: { id: user.id },
              data: { passwordHash: await bcrypt.hash(password, BCRYPT_COST) },
            })
            .catch(() => undefined);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
