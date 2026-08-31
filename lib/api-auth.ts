import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import type { SessionUser } from "@/lib/usuarios/types"

/**
 * Requiere una sesión activa cuyo rol tenga el flag es_admin (NextAuth).
 * Devuelve el usuario de sesión simplificado o null si no corresponde.
 * Se usa en los route handlers para proteger los endpoints.
 */
export async function requireSessionAdmin(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || !session.user.esAdmin) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email ?? session.user.id,
    role: session.user.role,
  }
}
