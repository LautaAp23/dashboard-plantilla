import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: string
      /** true si el rol del usuario tiene el flag es_admin activo. */
      esAdmin?: boolean
      /** true si el usuario debe cambiar su contraseña (primer login o solicitud admin). */
      primer_login?: boolean
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: string
    esAdmin?: boolean
    primer_login?: boolean
    lastActivity?: number
  }
}