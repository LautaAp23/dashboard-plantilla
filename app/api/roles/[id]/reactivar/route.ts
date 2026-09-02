import { requireSessionAdmin } from "@/lib/api-auth"
import { manejarError, ok, unauthorized } from "@/lib/api-response"
import { reactivarRol } from "@/lib/roles/service"

/** POST /api/roles/:id/reactivar — reactiva un rol dado de baja. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await requireSessionAdmin()
  if (!sesion) return unauthorized()

  const { id } = await params

  try {
    await reactivarRol(id)
    return ok({ id_rol: id })
  } catch (error) {
    return manejarError(error)
  }
}