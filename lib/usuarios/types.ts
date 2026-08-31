import type {
  CrearUsuarioInput,
  ActualizarUsuarioInput,
} from "@/lib/usuarios/schemas"
import type { ListarUsuariosResult } from "@/lib/usuarios/queries"

/**
 * Tipos compartidos del contrato HTTP del módulo de usuarios.
 * Flujo: UI → hook → route handler → servicio → Prisma.
 *
 * Este módulo no debe importar next-auth ni Prisma: define solo
 * "contratos" (formas de datos) que cruzan las capas.
 */

/** Usuario de sesión simplificado que el servicio recibe como parámetro. */
export type SessionUser = {
  id: string
  email: string
  role?: string
}

/** Filtros del listado tal como llegan por query string del endpoint HTTP. */
export type ListarUsuariosFiltros = {
  q?: string
  estado?: "activos" | "inactivos" | "todos"
  desde?: string // YYYY-MM-DD
  hasta?: string // YYYY-MM-DD
  page?: number
  por?: number
}

export type { CrearUsuarioInput, ActualizarUsuarioInput, ListarUsuariosResult }

/** Resultado de una mutación: la UI lee .success / .error para mostrar feedback. */
export type ResultadoAccion = { success: true } | { success: false; error: string }

/** Códigos de error de dominio traducidos a status HTTP en el handler. */
export type DominioErrorCode =
  | "VALIDACION"
  | "DUPLICADO_EMAIL"
  | "DUPLICADO_DNI"
  | "DUPLICADO_NOMBRE"
  | "NO_ENCONTRADO"
  | "AUTO_MODIFICACION"
  | "ROL_PROTEGIDO"

/** Error de negocio tipado que lanza el servicio y traduce el route handler. */
export class DominioError extends Error {
  readonly code: DominioErrorCode

  constructor(code: DominioErrorCode, message: string) {
    super(message)
    this.name = "DominioError"
    this.code = code
  }
}
