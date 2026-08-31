"use client"

import { useCallback, useState } from "react"

import type { ListarRolesResult } from "@/lib/roles/queries"
import type {
  ActualizarRolInput,
  CrearRolInput,
} from "@/lib/roles/schemas"
import type { ResultadoAccion } from "@/lib/usuarios/types"

/**
 * Hook cliente del módulo de roles.
 * Flujo: UI → hook → endpoint HTTP → servicio → Prisma.
 *
 * - Solo consume endpoints HTTP (no toca Prisma ni server actions).
 * - fetch con credentials incluido (sesión de cookies) y cache: no-store.
 */

const API_BASE = "/api/roles"

type ListaEstado = {
  data: ListarRolesResult | null
  cargando: boolean
  error: string | null
}

type ListarRolesFiltros = {
  q?: string
  estado?: "activos" | "inactivos" | "todos"
  page?: number
  por?: number
}

function extraerMensaje(error: unknown): string {
  if (error instanceof Error) return error.message
  return "Ocurrió un error inesperado"
}

async function peticion(
  url: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(url, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })
}

async function procesar<T>(respuesta: Response): Promise<T> {
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

function construirUrlLista(filtros: ListarRolesFiltros): string {
  const params = new URLSearchParams()
  const q = filtros.q?.trim()
  if (q) params.set("q", q)
  if (filtros.estado && filtros.estado !== "activos") {
    params.set("estado", filtros.estado)
  }
  if (filtros.page && filtros.page > 1) params.set("page", String(filtros.page))
  if (filtros.por && filtros.por !== 10) params.set("por", String(filtros.por))

  const qs = params.toString()
  return qs ? `${API_BASE}?${qs}` : API_BASE
}

export function useRoles() {
  const [lista, setLista] = useState<ListaEstado>({
    data: null,
    cargando: false,
    error: null,
  })
  const [accionPendiente, setAccionPendiente] = useState<string | null>(null)

  /** Carga / recarga el listado con los filtros dados. */
  const listarRoles = useCallback(
    async (filtros: ListarRolesFiltros): Promise<ListarRolesResult | null> => {
      setLista((prev) => ({ ...prev, cargando: true, error: null }))
      try {
        const data = await peticion(construirUrlLista(filtros)).then((r) =>
          procesar<ListarRolesResult>(r)
        )
        setLista({ data, cargando: false, error: null })
        return data
      } catch (error) {
        const mensaje = extraerMensaje(error)
        setLista({ data: null, cargando: false, error: mensaje })
        return null
      }
    },
    []
  )

  /** Obtiene el detalle de un rol. */
  const obtenerRol = useCallback(async (id: string) => {
    try {
      const respuesta = await peticion(`${API_BASE}/${id}`)
      return await procesar(respuesta)
    } catch {
      return null
    }
  }, [])

  /** Crea un rol. */
  const crearRol = useCallback(
    async (input: CrearRolInput): Promise<ResultadoAccion> => {
      setAccionPendiente("crear")
      try {
        const respuesta = await peticion(API_BASE, {
          method: "POST",
          body: JSON.stringify(input),
        })
        await procesar(respuesta)
        return { success: true }
      } catch (error) {
        return { success: false, error: extraerMensaje(error) }
      } finally {
        setAccionPendiente(null)
      }
    },
    []
  )

  const actualizarRol = useCallback(
    async (id: string, input: ActualizarRolInput): Promise<ResultadoAccion> => {
      setAccionPendiente("actualizar")
      try {
        const respuesta = await peticion(`${API_BASE}/${id}`, {
          method: "PATCH",
          body: JSON.stringify(input),
        })
        await procesar(respuesta)
        return { success: true }
      } catch (error) {
        return { success: false, error: extraerMensaje(error) }
      } finally {
        setAccionPendiente(null)
      }
    },
    []
  )

  async function cambiarEstado(
    id: string,
    accion: "baja" | "reactivar"
  ): Promise<ResultadoAccion> {
    setAccionPendiente(id)
    try {
      const respuesta = await peticion(`${API_BASE}/${id}/${accion}`, {
        method: "POST",
      })
      await procesar(respuesta)
      return { success: true }
    } catch (error) {
      return { success: false, error: extraerMensaje(error) }
    } finally {
      setAccionPendiente(null)
    }
  }

  const darDeBaja = useCallback((id: string) => cambiarEstado(id, "baja"), [])
  const reactivar = useCallback(
    (id: string) => cambiarEstado(id, "reactivar"),
    []
  )

  return {
    // Estado del listado
    data: lista.data,
    cargando: lista.cargando,
    errorLista: lista.error,
    // Estado compartido de mutaciones
    accionPendiente,
    // Funciones
    listarRoles,
    obtenerRol,
    crearRol,
    actualizarRol,
    darDeBaja,
    reactivar,
  }
}