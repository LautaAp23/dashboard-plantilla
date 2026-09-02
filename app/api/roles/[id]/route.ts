import type { NextRequest } from "next/server"

import { requireSessionAdmin } from "@/lib/api-auth"
import {
  badRequest,
  manejarError,
  ok,
  unauthorized,
} from "@/lib/api-response"
import {
  actualizarRol,
  obtenerRol,
} from "@/lib/roles/service"

/**
 * GET /api/roles/:id — detalle de un rol.
 * PATCH /api/roles/:id — edición (duplicados excluyendo id).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await requireSessionAdmin()
  if (!sesion) return unauthorized()

  const { id } = await params

  try {
    const rol = await obtenerRol(id)
    return ok(rol)
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
    await actualizarRol(id, body as never)
    return ok({ id_rol: id })
  } catch (error) {
    return manejarError(error)
  }
}