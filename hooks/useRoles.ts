"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type { ListarRolesResult } from "@/lib/roles/queries"
import type {
  ActualizarRolInput,
  CrearRolInput,
} from "@/lib/roles/schemas"
import type { ResultadoAccion } from "@/lib/types/common"
import { extraerMensaje, peticion, procesar } from "@/hooks/use-api"

const API_BASE = "/api/roles"

type ListarRolesFiltros = {
  q?: string
  estado?: "activos" | "inactivos" | "todos"
  page?: number
  por?: number
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

export function useRoles(filtros?: ListarRolesFiltros) {
  const queryClient = useQueryClient()

  const listarQuery = useQuery({
    queryKey: ["roles", filtros],
    queryFn: async () => {
      if (!filtros) return null
      const data = await peticion(construirUrlLista(filtros)).then((r) =>
        procesar<ListarRolesResult>(r)
      )
      return data
    },
    enabled: !!filtros,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const crearMutation = useMutation({
    mutationFn: async (input: CrearRolInput) => {
      const respuesta = await peticion(API_BASE, {
        method: "POST",
        body: JSON.stringify(input),
      })
      await procesar(respuesta)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
    },
  })

  const actualizarMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ActualizarRolInput }) => {
      const respuesta = await peticion(`${API_BASE}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      })
      await procesar(respuesta)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
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
      queryClient.invalidateQueries({ queryKey: ["roles"] })
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
      queryClient.invalidateQueries({ queryKey: ["roles"] })
    },
  })

  return {
    data: listarQuery.data ?? null,
    cargando: listarQuery.isLoading,
    errorLista: listarQuery.error ? extraerMensaje(listarQuery.error) : null,

    crearRol: async (input: CrearRolInput): Promise<ResultadoAccion> => {
      try {
        await crearMutation.mutateAsync(input)
        return { success: true }
      } catch (error) {
        return { success: false, error: extraerMensaje(error) }
      }
    },

    actualizarRol: async (
      id: string,
      input: ActualizarRolInput
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
