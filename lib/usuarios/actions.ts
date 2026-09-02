"use server"

import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import {
  actualizarUsuario as actualizarUsuarioService,
  bajaUsuario as bajaUsuarioService,
  crearUsuario as crearUsuarioService,
  reactivarUsuario as reactivarUsuarioService,
} from "@/lib/usuarios/service"
import type {
  ActualizarUsuarioInput,
  CrearUsuarioInput,
} from "@/lib/usuarios/schemas"
import type { ResultadoAccion, SessionUser } from "@/lib/usuarios/types"

/**
 * Capa de compatibilidad temporal (server actions).
 *
 * Hoy la cadena principal es UI → hook → API → servicio → Prisma.
 * Estas actions se conservan únicamente como compatibilidad: delegan en el
 * servicio (lib/usuarios/service.ts) sin duplicar lógica.
 */
export type { ResultadoAccion } from "@/lib/usuarios/types"

async function requireSesionAdmin(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session.user.esAdmin) return null
  return {
    id: session.user.id,
    email: session.user.email ?? session.user.id,
    role: session.user.role,
  }
}

function aResultado(error: unknown): ResultadoAccion {
  return {
    success: false,
    error: error instanceof Error ? error.message : "No se pudo completar la operación",
  }
}

export async function crearUsuario(
  input: CrearUsuarioInput
): Promise<ResultadoAccion> {
  const sesion = await requireSesionAdmin()
  if (!sesion) return { success: false, error: "No autorizado" }
  try {
    await crearUsuarioService(input, sesion)
    return { success: true }
  } catch (error) {
    return aResultado(error)
  }
}

export async function actualizarUsuario(
  userId: string,
  input: ActualizarUsuarioInput
): Promise<ResultadoAccion> {
  const sesion = await requireSesionAdmin()
  if (!sesion) return { success: false, error: "No autorizado" }
  try {
    await actualizarUsuarioService(userId, input, sesion)
    return { success: true }
  } catch (error) {
    return aResultado(error)
  }
}

export async function bajaUsuario(userId: string): Promise<ResultadoAccion> {
  const sesion = await requireSesionAdmin()
  if (!sesion) return { success: false, error: "No autorizado" }
  try {
    await bajaUsuarioService(userId, sesion)
    return { success: true }
  } catch (error) {
    return aResultado(error)
  }
}

export async function reactivarUsuario(userId: string): Promise<ResultadoAccion> {
  const sesion = await requireSesionAdmin()
  if (!sesion) return { success: false, error: "No autorizado" }
  try {
    await reactivarUsuarioService(userId, sesion)
    return { success: true }
  } catch (error) {
    return aResultado(error)
  }
}
