import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import type { SessionUser } from "@/lib/types/common"

/**
 * Helpers de autenticación centralizados para Route Handlers.
 * Usar requireSession() para endpoints que requieren cualquier usuario logueado
 * (ej. /api/cuenta/*) y requireSessionAdmin() para endpoints admin.
 * El proxy ya garantiza que haya sesión y que primer_login esté resuelto,
 * pero cada handler reaplica la verificación (defensa en profundidad).
 */

export async function requireSession(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  return {
    id: session.user.id,
    email: session.user.email ?? session.user.id,
    role: session.user.role,
  }
}

export async function requireSessionAdmin(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session.user.esAdmin) return null
  return {
    id: session.user.id,
    email: session.user.email ?? session.user.id,
    role: session.user.role,
  }
}
