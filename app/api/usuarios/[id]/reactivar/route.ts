import type { NextRequest } from "next/server"

import { requireSessionAdmin } from "@/lib/auth-guard"
import { manejarError, ok, unauthorized } from "@/lib/api-response"
import { reactivarUsuario } from "@/lib/usuarios/service"

/**
 * POST /api/usuarios/:id/reactivar — reactivación (estado_user = true).
 * No permite modificar el propio estado y guarda usuario_modificador.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await requireSessionAdmin()
  if (!sesion) return unauthorized()

  const { id } = await params

  try {
    await reactivarUsuario(id, sesion)
    return ok({ id, estado: "reactivado" })
  } catch (error) {
    return manejarError(error)
  }
}
