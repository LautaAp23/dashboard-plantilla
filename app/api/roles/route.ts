import type { NextRequest } from "next/server"

import { requireSessionAdmin } from "@/lib/api-auth"
import {
  badRequest,
  created,
  manejarError,
  ok,
  unauthorized,
} from "@/lib/api-response"
import { listarRolesQuerySchema } from "@/lib/roles/schemas"
import {
  crearRol,
  listarRolesService,
} from "@/lib/roles/service"

/**
 * GET /api/roles?q=&estado=activos|inactivos|todos&page=&por=
 * Listado paginado con filtros. Por defecto: activos.
 */
export async function GET(request: NextRequest) {
  const sesion = await requireSessionAdmin()
  if (!sesion) return unauthorized()

  const raw: Record<string, string | undefined> = {}
  for (const [clave, valor] of request.nextUrl.searchParams) {
    raw[clave] = valor
  }

  const parsed = listarRolesQuerySchema.safeParse(raw)
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message)
  }

  const estado =
    parsed.data.estado === "inactivos"
      ? false
      : parsed.data.estado === "todos"
        ? undefined
        : true

  try {
    const data = await listarRolesService({
      q: parsed.data.q,
      estado,
      page: parsed.data.page,
      porPagina: parsed.data.por,
    })
    return ok(data)
  } catch (error) {
    return manejarError(error)
  }
}

/**
 * POST /api/roles — crea un rol (valida duplicados, trazabilidad de sesión).
 */
export async function POST(request: Request) {
  const sesion = await requireSessionAdmin()
  if (!sesion) return unauthorized()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequest("El cuerpo de la solicitud debe ser JSON válido")
  }

  try {
    const idRol = await crearRol(body as never, sesion)
    return created({ id_rol: idRol })
  } catch (error) {
    return manejarError(error)
  }
}