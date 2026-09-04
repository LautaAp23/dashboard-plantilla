import type { NextRequest } from "next/server"

import { requireSessionAdmin } from "@/lib/auth-guard"
import {
  badRequest,
  manejarError,
  ok,
  unauthorized,
} from "@/lib/api-response"
import {
  actualizarUsuario,
  obtenerUsuario,
} from "@/lib/usuarios/service"

/**
 * GET /api/usuarios/:id — detalle de un usuario (sin password_user).
 * PATCH /api/usuarios/:id — edición (duplicados excluyendo id, contraseña opcional).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await requireSessionAdmin()
  if (!sesion) return unauthorized()

  const { id } = await params

  try {
    const usuario = await obtenerUsuario(id)
    return ok(usuario)
  } catch (error) {
    return manejarError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await requireSessionAdmin()
  if (!sesion) return unauthorized()

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequest("El cuerpo de la solicitud debe ser JSON válido")
  }

  try {
    await actualizarUsuario(id, body as never, sesion)
    return ok({ id })
  } catch (error) {
    return manejarError(error)
  }
}
