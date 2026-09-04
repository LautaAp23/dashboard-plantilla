/**
 * Tipos compartidos del contrato HTTP y dominio.
 * Flujo: UI → hook → route handler → servicio → Prisma.
 *
 * Este módulo no debe importar next-auth ni Prisma: define solo
 * "contratos" (formas de datos) que cruzan las capas.
 * Centraliza tipos que antes vivían en lib/usuarios/types.ts
 * para ser reutilizables por todos los módulos (cuenta, roles, etc.)
 * sin acoplar módulos entre sí.
 */

/** Usuario de sesión simplificado que el servicio recibe como parámetro. */
export type SessionUser = {
  id: string
  email: string
  role?: string
}

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
