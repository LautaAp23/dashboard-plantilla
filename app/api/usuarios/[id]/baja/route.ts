import type { NextRequest } from "next/server"

import { requireSessionAdmin } from "@/lib/api-auth"
import { manejarError, ok, unauthorized } from "@/lib/api-response"
import { bajaUsuario } from "@/lib/usuarios/service"

/**
 * POST /api/usuarios/:id/baja — baja lógica (estado_user = false).
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
    await bajaUsuario(id, sesion)
    return ok({ id, estado: "baja" })
  } catch (error) {
    return manejarError(error)
  }
}
