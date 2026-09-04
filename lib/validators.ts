import { z } from "zod"

/**
 * Helpers de validación compartidos entre módulos.
 * Centraliza reglas de persistencia "sin NULLs" y paginación.
 */

// Regla de persistencia "sin NULLs": un opcional se reduce a string vacío ("").
// El string vacío se persiste literal, nunca null.
export function normalizarOpcional(valor: string | null | undefined): string {
  const limpio = valor?.trim()
  return limpio ? limpio : ""
}

export const paginacionQuery = {
  page: z.coerce.number().int().min(1).optional(),
  por: z.coerce.number().int().min(1).max(100).optional(),
}

export const busquedaQuery = z.string().trim().max(120).optional()

export const filtroEstadoQuery = z.enum(["activos", "inactivos", "todos"]).optional()

export const fechaQuery = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
