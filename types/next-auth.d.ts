import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: string
      /** true si el rol del usuario tiene el flag es_admin activo. */
      esAdmin?: boolean
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: string
    esAdmin?: boolean
    lastActivity?: number
  }
}