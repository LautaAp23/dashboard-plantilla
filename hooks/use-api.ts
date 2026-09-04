"use client"

/**
 * Helpers HTTP compartidos por todos los hooks.
 * Centraliza el patrón fetch → procesar → extraerMensaje
 * para evitar duplicación entre useUsuarios, useRoles y useCuenta.
 */

export function extraerMensaje(error: unknown): string {
  if (error instanceof Error) return error.message
  return "Ocurrió un error inesperado"
}

export async function peticion(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    credentials: "include",
    // cache: "no-store" removido: React Query maneja staleness (30s) y
    // evita revalidación forzada en cada focus/navigation
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })
}

export async function procesar<T>(respuesta: Response): Promise<T> {
  let cuerpo: { ok: boolean; data?: T; error?: { message?: string } } | null
  try {
    cuerpo = await respuesta.json()
  } catch {
    cuerpo = null
  }

  if (!respuesta.ok || !cuerpo?.ok) {
    const message = cuerpo?.error?.message ?? "Ocurrió un error inesperado"
    throw new Error(message)
  }

  return cuerpo.data as T
}
