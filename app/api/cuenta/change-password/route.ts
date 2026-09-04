import { requireSession } from "@/lib/auth-guard"
import { badRequest, manejarError, ok, unauthorized } from "@/lib/api-response"
import { changePasswordService } from "@/lib/cuenta/service"

export async function POST(request: Request) {
  const sesion = await requireSession()
  if (!sesion) return unauthorized()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequest("El cuerpo de la solicitud debe ser JSON válido")
  }

  try {
    await changePasswordService(body as never, sesion)
    return ok({ success: true })
  } catch (error) {
    return manejarError(error)
  }
}
