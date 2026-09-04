"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useCuenta } from "@/hooks/useCuenta"
import { useConfirm } from "@/hooks/use-confirm"

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "La contraseña actual es obligatoria"),
    newPassword: z
      .string()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirmá la nueva contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type ChangePasswordValues = z.infer<typeof changePasswordSchema>

type ChangePasswordFormProps = {
  /**
   * Configura el formulario para el flujo de "cambio obligatorio por primer
   * inicio de sesión". Suelen mostrarse en la pantalla de login, no dentro del
   * panel. Al terminar correctamente se invoca onSuccess para que el
   * componente padre refresque la sesión y navegue.
   */
  esPrimerLogin?: boolean
  onSuccess?: () => void | Promise<void>
}

export function ChangePasswordForm({
  esPrimerLogin = false,
  onSuccess,
}: ChangePasswordFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { confirm, ConfirmDialog } = useConfirm()
  const { changePassword } = useCuenta()
  const router = useRouter()

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: ChangePasswordValues) {
    const ok = await confirm({
      title: "Cambiar contraseña",
      description: "¿Seguro que querés cambiar tu contraseña?",
      confirmLabel: "Guardar cambios",
    })
    if (!ok) return

    setError(null)
    setSuccess(false)

    const result = await changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    })

    if (!result.success) {
      setError(result.error)
      return
    }

    setSuccess(true)
    form.reset()

    if (onSuccess) {
      await onSuccess()
    } else if (esPrimerLogin) {
      // Compatibilidad con el caso de uso dentro del panel.
      router.push("/home")
    }
  }

  return (
    <>
      {ConfirmDialog}
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Cambiar contraseña
          </CardTitle>
          <CardDescription>
            Usá al menos 8 caracteres para la nueva contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <AlertTitle>Contraseña actualizada</AlertTitle>
              <AlertDescription>
                Tu contraseña se cambió correctamente.
              </AlertDescription>
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
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña actual</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar nueva contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="mt-2 w-full sm:w-auto sm:self-end"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Spinner />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  )
}
