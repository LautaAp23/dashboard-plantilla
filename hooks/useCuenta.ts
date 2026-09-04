"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { ChangePasswordInput } from "@/lib/cuenta/schemas"
import type { ResultadoAccion } from "@/lib/types/common"
import { extraerMensaje, peticion, procesar } from "@/hooks/use-api"

const API = "/api/cuenta/change-password"

export function useCuenta() {
  const queryClient = useQueryClient()

  const changePasswordMutation = useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      const respuesta = await peticion(API, {
        method: "POST",
        body: JSON.stringify(input),
      })
      await procesar(respuesta)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] })
    },
  })

  return {
    changePassword: async (input: ChangePasswordInput): Promise<ResultadoAccion> => {
      try {
        await changePasswordMutation.mutateAsync(input)
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: extraerMensaje(error),
        }
      }
    },
    cargando: changePasswordMutation.isPending,
  }
}
