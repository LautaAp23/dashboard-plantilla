import { z } from "zod"

export const nombreRolSchema = z
  .string()
  .trim()
  .min(2, "El nombre del rol debe tener al menos 2 caracteres")
  .max(60, "El nombre del rol no puede superar los 60 caracteres")

export const crearRolSchema = z.strictObject({
  nombre_rol: nombreRolSchema,
})

export const actualizarRolSchema = z.strictObject({
  nombre_rol: nombreRolSchema,
})

export type CrearRolInput = z.infer<typeof crearRolSchema>
export type ActualizarRolInput = z.infer<typeof actualizarRolSchema>

/** Query params del endpoint GET /api/roles (listado con filtros). */
export const listarRolesQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  estado: z.enum(["activos", "inactivos", "todos"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  por: z.coerce.number().int().min(1).max(100).optional(),
})

export type ListarRolesQuery = z.infer<typeof listarRolesQuerySchema>