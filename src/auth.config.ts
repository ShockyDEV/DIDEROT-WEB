import type { NextAuthConfig } from "next-auth";

/**
 * Configuración base de NextAuth, segura para el runtime Edge (middleware):
 * no importa Prisma ni bcrypt. El provider Credentials (que sí los usa) se
 * añade en `src/lib/auth.ts`, que solo se ejecuta en runtime Node.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  providers: [], // se completa en lib/auth.ts
  callbacks: {
    // `user` solo llega en el sign-in; copia id y rol al token JWT
    // (sin tocar la BD: authorize ya los cargó).
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 h
  },
};
