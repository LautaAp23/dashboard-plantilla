import { requireSessionAdmin } from "@/lib/api-auth"
import { manejarError, ok, unauthorized } from "@/lib/api-response"
import { bajaRol } from "@/lib/roles/service"

/** POST /api/roles/:id/baja — baja lógica de un rol (no permite el rol Administrador). */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await requireSessionAdmin()
  if (!sesion) return unauthorized()

  const { id } = await params

  try {
    await bajaRol(id)
    return ok({ id_rol: id })
  } catch (error) {
    return manejarError(error)
  }
}