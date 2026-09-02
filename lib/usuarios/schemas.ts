import { z } from "zod"

// DNI argentino: 7 u 8 dígitos numéricos.
export const DNI_REGEX = /^\d{7,8}$/

const idRolSchema = z.string().min(1, "Seleccioná un rol")

/**
 * Campos de trazabilidad: NUNCA deben llegar desde el cliente.
 * Ni el frontend ni un payload manipulado pueden setearlos porque:
 *  - ambos esquemas usan .strict(), que rechaza cualquier clave extra, y
 *  - los server actions construyen la sentencia a Prisma manualmente,
 *    pickeando solo los campos permitidos (nunca se hace un spread del input).
 */
export const TRACEABILITY_FIELDS = [
  "fechayhora_user",
  "ultima_conexion_user",
  "usuario_creador",
  "usuario_modificador",
  "fechayhora_modificacion",
  "estado_user",
] as const

const nombreSchema = z
  .string()
  .trim()
  .min(3, "El nombre y apellido debe tener al menos 3 caracteres")
  .max(120, "El nombre y apellido no puede superar los 120 caracteres")

const dniSchema = z
  .string()
  .trim()
  .regex(DNI_REGEX, "El DNI debe tener 7 u 8 dígitos numéricos")

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("El formato del email no es válido")
  .max(254, "El email no puede superar los 254 caracteres")

// Campo opcional de entrada: se normaliza a string vacío (""), NUNCA a null
// (regla de persistencia "sin NULLs"). La conversión final la hace
// `normalizarOpcional` en el servicio antes de persistir.
const opcionalSchema = (max: number, mensaje: string) =>
  z.string().trim().max(max, mensaje).optional().or(z.literal(""))

export const crearUsuarioSchema = z.strictObject({
  nombreyapellido_user: nombreSchema,
  dni_user: dniSchema,
  email_user: emailSchema,
  direccion_user: opcionalSchema(200, "La dirección no puede superar los 200 caracteres"),
  telefono_user: opcionalSchema(30, "El teléfono no puede superar los 30 caracteres"),
  id_rol: idRolSchema,
})

export const actualizarUsuarioSchema = z
  .strictObject({
    nombreyapellido_user: nombreSchema,
    dni_user: dniSchema,
    email_user: emailSchema,
    direccion_user: opcionalSchema(200, "La dirección no puede superar los 200 caracteres"),
    telefono_user: opcionalSchema(30, "El teléfono no puede superar los 30 caracteres"),
    id_rol: idRolSchema,
  })

/** Query params del endpoint GET /api/usuarios (listado con filtros). */
export const listarUsuariosQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  estado: z.enum(["activos", "inactivos", "todos"]).optional(),
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).optional(),
  por: z.coerce.number().int().min(1).max(100).optional(),
})

export type ListarUsuariosQuery = z.infer<typeof listarUsuariosQuerySchema>

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>

// Regla de persistencia "sin NULLs": un opcional se reduce a string vacío ("").
// El string vacío se persiste literal, nunca null.
export function normalizarOpcional(valor: string | null | undefined): string {
  const limpio = valor?.trim()
  return limpio ? limpio : ""
}