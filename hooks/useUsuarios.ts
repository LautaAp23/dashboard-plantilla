"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  ActualizarUsuarioInput,
  CrearUsuarioInput,
} from "@/lib/usuarios/schemas"
import type { ListarUsuariosResult } from "@/lib/usuarios/queries"
import type {
  ListarUsuariosFiltros,
  ResultadoAccion,
} from "@/lib/usuarios/types"

const API_BASE = "/api/usuarios"

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

export function useUsuarios(filtros: ListarUsuariosFiltros) {
  const queryClient = useQueryClient()

  const listarQuery = useQuery({
    queryKey: ["usuarios", filtros],
    queryFn: async () => {
      const data = await peticion(construirUrlLista(filtros)).then((r) =>
        procesar<ListarUsuariosResult>(r)
      )
      return data
    },
  })

  const crearMutation = useMutation({
    mutationFn: async (input: CrearUsuarioInput) => {
      const respuesta = await peticion(API_BASE, {
        method: "POST",
        body: JSON.stringify(input),
      })
      await procesar(respuesta)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] })
    },
  })

  const actualizarMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ActualizarUsuarioInput }) => {
      const respuesta = await peticion(`${API_BASE}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      })
      await procesar(respuesta)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] })
    },
  })

  const bajaMutation = useMutation({
    mutationFn: async (id: string) => {
      const respuesta = await peticion(`${API_BASE}/${id}/baja`, {
        method: "POST",
      })
      await procesar(respuesta)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] })
    },
  })

  const reactivarMutation = useMutation({
    mutationFn: async (id: string) => {
      const respuesta = await peticion(`${API_BASE}/${id}/reactivar`, {
        method: "POST",
      })
      await procesar(respuesta)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] })
    },
  })

  return {
    data: listarQuery.data ?? null,
    cargando: listarQuery.isLoading,
    errorLista: listarQuery.error ? extraerMensaje(listarQuery.error) : null,

    crearUsuario: async (input: CrearUsuarioInput): Promise<ResultadoAccion> => {
      try {
        await crearMutation.mutateAsync(input)
        return { success: true }
      } catch (error) {
        return { success: false, error: extraerMensaje(error) }
      }
    },

    actualizarUsuario: async (
      id: string,
      input: ActualizarUsuarioInput
    ): Promise<ResultadoAccion> => {
      try {
        await actualizarMutation.mutateAsync({ id, input })
        return { success: true }
      } catch (error) {
        return { success: false, error: extraerMensaje(error) }
      }
    },

    darDeBaja: async (id: string): Promise<ResultadoAccion> => {
      try {
        await bajaMutation.mutateAsync(id)
        return { success: true }
      } catch (error) {
        return { success: false, error: extraerMensaje(error) }
      }
    },

    reactivar: async (id: string): Promise<ResultadoAccion> => {
      try {
        await reactivarMutation.mutateAsync(id)
        return { success: true }
      } catch (error) {
        return { success: false, error: extraerMensaje(error) }
      }
    },

    accionPendiente: crearMutation.isPending
      ? "crear"
      : actualizarMutation.isPending
        ? "actualizar"
        : bajaMutation.isPending || reactivarMutation.isPending
          ? "accion"
          : null,
  }
}
