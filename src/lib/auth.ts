import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import * as bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { authConfig } from "@/auth.config";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

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
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

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
