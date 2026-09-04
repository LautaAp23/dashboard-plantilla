import type { NextRequest } from "next/server"

import { requireSessionAdmin } from "@/lib/auth-guard"
import {
  badRequest,
  created,
  manejarError,
  ok,
  unauthorized,
} from "@/lib/api-response"
import { listarUsuariosQuerySchema } from "@/lib/usuarios/schemas"
import {
  crearUsuario,
  listarUsuariosService,
} from "@/lib/usuarios/service"

/**
 * GET /api/usuarios?q=&estado=activos|inactivos|todos&desde=&hasta=&page=&por=
 * Listado paginado con filtros. Por defecto: activos.
 */
export async function GET(request: NextRequest) {
  const sesion = await requireSessionAdmin()
  if (!sesion) return unauthorized()

  const raw: Record<string, string | undefined> = {}
  for (const [clave, valor] of request.nextUrl.searchParams) {
    raw[clave] = valor
  }

  const parsed = listarUsuariosQuerySchema.safeParse(raw)
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message)
  }

  const q = parsed.data.q
  const estado =
    parsed.data.estado === "inactivos"
      ? false
      : parsed.data.estado === "todos"
        ? undefined
        : true

  // Convierte las fechas YYYY-MM-DD a Date local para el servicio.
  const desde = parseFechaLocal(parsed.data.desde)
  const hasta = parseFechaLocal(parsed.data.hasta)

  try {
    const data = await listarUsuariosService({
      q,
      estado_user: estado,
      desde,
      hasta,
      page: parsed.data.page,
      porPagina: parsed.data.por,
    })
    return ok(data)
  } catch (error) {
    return manejarError(error)
  }
}

/**
 * POST /api/usuarios
 * Crea un usuario (valida duplicados, hashea contraseña, trazabilidad de sesión).
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
    const usuario = await crearUsuario(body as never, sesion)
    return created(usuario)
  } catch (error) {
    return manejarError(error)
  }
}

function parseFechaLocal(valor: string | undefined): Date | undefined {
  if (!valor) return undefined
  const [anio, mes, dia] = valor.split("-").map(Number)
  if (!anio || !mes || !dia) return undefined
  return new Date(anio, mes - 1, dia)
}
