import { Role } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role | string;
      /** Versión de sesión de la cuenta al iniciar sesión (ver User.sessionVersion). */
      sessionVersion?: number;
    };
  }

  interface User {
    id?: string;
    email?: string | null;
    name?: string | null;
    role: Role | string;
    sessionVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: Role | string;
    sessionVersion?: number;
  }
}
