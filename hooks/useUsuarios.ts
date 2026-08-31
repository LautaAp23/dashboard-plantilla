"use client"

import { useCallback, useState } from "react"

import type {
  ActualizarUsuarioInput,
  CrearUsuarioInput,
} from "@/lib/usuarios/schemas"
import type { ListarUsuariosResult, UsuarioListado } from "@/lib/usuarios/queries"
import type {
  ListarUsuariosFiltros,
  ResultadoAccion,
} from "@/lib/usuarios/types"

/**
 * Hook cliente del módulo de usuarios.
 * Flujo: UI → hook → endpoint HTTP → servicio → Prisma.
 *
 * - Solo consume endpoints HTTP (no toca Prisma ni server actions).
 * - fetch con credentials incluido (sesión de cookies) y cache: no-store.
 * - Expone estados de loading/error/data y funciones para cada operación.
 */

const API_BASE = "/api/usuarios"

type ListaEstado = {
  data: ListarUsuariosResult | null
  cargando: boolean
  error: string | null
}

function extraerMensaje(error: unknown): string {
  if (error instanceof Error) return error.message
  return "Ocurrió un error inesperado"
}

// fetch con credenciales y cabeceras comunes para mutaciones.
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

// Procesa la respuesta estándar { ok: true, data } | { ok: false, error: {...} }.
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

function construirUrlLista(filtros: ListarUsuariosFiltros): string {
  const params = new URLSearchParams()
  const q = filtros.q?.trim()
  if (q) params.set("q", q)
  if (filtros.estado && filtros.estado !== "activos") {
    params.set("estado", filtros.estado)
  }
  if (filtros.desde) params.set("desde", filtros.desde)
  if (filtros.hasta) params.set("hasta", filtros.hasta)
  if (filtros.page && filtros.page > 1) params.set("page", String(filtros.page))
  if (filtros.por && filtros.por !== 10) params.set("por", String(filtros.por))

  const qs = params.toString()
  return qs ? `${API_BASE}?${qs}` : API_BASE
}

export function useUsuarios() {
  const [lista, setLista] = useState<ListaEstado>({
    data: null,
    cargando: false,
    error: null,
  })
  const [accionPendiente, setAccionPendiente] = useState<string | null>(null)

  /** Carga / recarga el listado con los filtros dados. Devuelve el resultado o null. */
  const listarUsuarios = useCallback(
    async (filtros: ListarUsuariosFiltros): Promise<ListarUsuariosResult | null> => {
      setLista((prev) => ({ ...prev, cargando: true, error: null }))
      try {
        const data = await peticion(construirUrlLista(filtros)).then((r) =>
          procesar<ListarUsuariosResult>(r)
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

  /** Obtiene el detalle de un usuario. */
  const obtenerUsuario = useCallback(
    async (id: string): Promise<UsuarioListado | null> => {
      try {
        const respuesta = await peticion(`${API_BASE}/${id}`)
        return await procesar<UsuarioListado>(respuesta)
      } catch {
        return null
      }
    },
    []
  )

  /** Crea un usuario. */
  const crearUsuario = useCallback(
    async (input: CrearUsuarioInput): Promise<ResultadoAccion> => {
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

  const actualizarUsuario = useCallback(
    async (
      id: string,
      input: ActualizarUsuarioInput
    ): Promise<ResultadoAccion> => {
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

  const darDeBaja = useCallback(
    (id: string) => cambiarEstado(id, "baja"),
    []
  )
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
    listarUsuarios,
    obtenerUsuario,
    crearUsuario,
    actualizarUsuario,
    darDeBaja,
    reactivar,
  }
}
