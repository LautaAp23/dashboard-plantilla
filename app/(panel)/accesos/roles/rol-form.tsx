"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"

import type { RolListado } from "@/lib/roles/queries"
import type {
  ActualizarRolInput,
  CrearRolInput,
} from "@/lib/roles/schemas"
import {
  actualizarRolSchema,
  crearRolSchema,
} from "@/lib/roles/schemas"
import type { ResultadoAccion } from "@/lib/usuarios/types"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

type RolFormProps = {
  mode: "crear" | "editar"
  rol?: RolListado
  crearRol: (input: CrearRolInput) => Promise<ResultadoAccion>
  actualizarRol: (
    id: string,
    input: ActualizarRolInput
  ) => Promise<ResultadoAccion>
  onSuccess: () => void
}

export function RolForm({
  mode,
  rol,
  crearRol,
  actualizarRol,
  onSuccess,
}: RolFormProps) {
  const [error, setError] = useState<string | null>(null)

  const esCrear = mode === "crear"

  const form = useForm<CrearRolInput | ActualizarRolInput>({
    resolver: zodResolver(esCrear ? crearRolSchema : actualizarRolSchema),
    defaultValues: esCrear
      ? { nombre_rol: "" }
      : { nombre_rol: rol?.nombre_rol ?? "" },
  })

  async function onSubmit(
    values: CrearRolInput | ActualizarRolInput
  ): Promise<void> {
    setError(null)

    const resultado: ResultadoAccion = esCrear
      ? await crearRol(values as CrearRolInput)
      : await actualizarRol(rol!.id_rol, values as ActualizarRolInput)

    if (!resultado.success) {
      setError(resultado.error)
      return
    }

    form.reset()
    onSuccess()
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <FormField
            control={form.control}
            name="nombre_rol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del rol</FormLabel>
                <FormControl>
                  <Input placeholder="P. ej. Supervisor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="min-w-32"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Spinner />
                  Guardando...
                </>
              ) : esCrear ? (
                "Crear rol"
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}