import { DominioError } from "@/lib/usuarios/types"

/**
 * Helpers compartidos de respuestas JSON estándar para los route handlers.
 *
 * Éxito:  { ok: true,  data: <payload> }
 * Error:  { ok: false, error: { code, message, details? } }
 */
export function ok<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ ok: true, data }, init)
}

export function created<T>(data: T): Response {
  return ok(data, { status: 201 })
}

export function noContent(): Response {
  return new Response(null, { status: 204 })
}

function fail(
  code: string,
  message: string,
  status: number,
  details?: unknown
): Response {
  return Response.json(
    {
      ok: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status }
  )
}

export const badRequest = (message = "Solicitud inválida", details?: unknown) =>
  fail("BAD_REQUEST", message, 400, details)

export const unauthorized = (message = "No autorizado") =>
  fail("NO_AUTORIZADO", message, 401)

export const forbidden = (message = "Sin permisos de administrador") =>
  fail("PROHIBIDO", message, 403)

export const notFound = (message = "Recurso no encontrado") =>
  fail("NO_ENCONTRADO", message, 404)

export const conflict = (message = "Conflicto con un recurso existente") =>
  fail("CONFLICTO", message, 409)

export const internalError = (message = "Error interno del servidor") =>
  fail("ERROR_INTERNO", message, 500)

/**
 * Traduce un error de dominio (DominioError) o un error desconocido
 * a la respuesta HTTP correspondiente.
 */
export function manejarError(error: unknown): Response {
  if (error instanceof DominioError) {
    switch (error.code) {
      case "DUPLICADO_EMAIL":
      case "DUPLICADO_DNI":
      case "DUPLICADO_NOMBRE":
        return conflict(error.message)
      case "NO_ENCONTRADO":
        return notFound(error.message)
      case "AUTO_MODIFICACION":
      case "ROL_PROTEGIDO":
        return badRequest(error.message)
      case "VALIDACION":
        return badRequest(error.message)
    }
  }
  return internalError()
}
