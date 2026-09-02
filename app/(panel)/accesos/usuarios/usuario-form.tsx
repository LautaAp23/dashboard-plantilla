"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"

import type {
  ActualizarUsuarioInput,
  CrearUsuarioInput,
} from "@/lib/usuarios/schemas"
import {
  actualizarUsuarioSchema,
  crearUsuarioSchema,
} from "@/lib/usuarios/schemas"
import type { ResultadoAccion } from "@/lib/usuarios/types"
import type { UsuarioListado } from "@/lib/usuarios/queries"

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
import {
  SelectContent,
  SelectItem,
  SelectList,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type RolOpcion = {
  id_rol: string
  nombre_rol: string
  es_admin: boolean
}

type UsuarioFormProps = {
  mode: "crear" | "editar"
  usuario?: UsuarioListado
  roles: RolOpcion[]
  crearUsuario: (input: CrearUsuarioInput) => Promise<ResultadoAccion>
  actualizarUsuario: (
    id: string,
    input: ActualizarUsuarioInput
  ) => Promise<ResultadoAccion>
  onSuccess: () => void
}

export function UsuarioForm({
  mode,
  usuario,
  roles,
  crearUsuario,
  actualizarUsuario,
  onSuccess,
}: UsuarioFormProps) {
  const [error, setError] = useState<string | null>(null)

  const esCrear = mode === "crear"

  const rolPorDefecto =
    roles.find((rol) => rol.es_admin)?.id_rol ?? roles[0]?.id_rol ?? ""

  const crearDefault: CrearUsuarioInput = {
    nombreyapellido_user: "",
    dni_user: "",
    email_user: "",
    direccion_user: "",
    telefono_user: "",
    id_rol: rolPorDefecto,
  }

  const editarDefault: ActualizarUsuarioInput = {
    nombreyapellido_user: usuario?.nombreyapellido_user ?? "",
    dni_user: usuario?.dni_user ?? "",
    email_user: usuario?.email_user ?? "",
    direccion_user: usuario?.direccion_user ?? "",
    telefono_user: usuario?.telefono_user ?? "",
    id_rol: usuario?.id_rol ?? rolPorDefecto,
  }

  const form = useForm<CrearUsuarioInput>({
    resolver:
      esCrear
        ? zodResolver(crearUsuarioSchema)
        : zodResolver(actualizarUsuarioSchema),
    defaultValues: esCrear ? crearDefault : editarDefault,
  })

  // Ambos schemas (crear/actualizar) producen el mismo contrato de datos:
  // no llevan password; el alta de contraseña se maneja por email al crear
  // y el cambio se resuelve con "solicitar cambio de contraseña".
  async function onSubmit(values: CrearUsuarioInput): Promise<void> {
    setError(null)

    const resultado: ResultadoAccion = esCrear
      ? await crearUsuario(values)
      : await actualizarUsuario(usuario!.id, values)

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
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="nombreyapellido_user"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Nombre y apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dni_user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DNI</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" placeholder="30123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="id_rol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <FormControl>
                    <SelectRoot
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {(value: string | null | undefined) => {
                            const rol = roles.find((r) => r.id_rol === value)
                            return rol
                              ? rol.nombre_rol
                              : "Seleccionar rol"
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectList>
                          {roles.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              No hay roles disponibles
                            </div>
                          ) : (
                            roles.map((rol) => (
                              <SelectItem key={rol.id_rol} value={rol.id_rol}>
                                {rol.nombre_rol}
                                {rol.es_admin && " (Administrador)"}
                              </SelectItem>
                            ))
                          )}
                        </SelectList>
                      </SelectContent>
                    </SelectRoot>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email_user"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="juan@correo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {esCrear && (
              <div className="sm:col-span-2 rounded-lg border border-muted bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                Al crear el usuario se generará una contraseña temporal y se
                enviará al correo electrónico indicado. En su primer inicio de
                sesión, el sistema le pedirá que la cambie.
              </div>
            )}

            <FormField
              control={form.control}
              name="telefono_user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input inputMode="tel" placeholder="011 5555 1234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="direccion_user"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Calle, número, ciudad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
                "Crear usuario"
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