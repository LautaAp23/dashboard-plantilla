import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChangePasswordForm } from "@/app/(panel)/cuenta/change-password-form"

export const metadata = {
  title: "Cambiar contraseña | hsse administracion",
}

export default async function CambiarPasswordPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Consulta el estado real en la BD para no depender del token JWT.
  const usuario = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { primer_login: true, email_user: true },
  })

  if (!usuario) {
    redirect("/login")
  }

  if (!usuario.primer_login) {
    redirect("/home")
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h2 className="text-xl font-semibold">Cambiar contraseña</h2>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Contraseña temporal
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">
              Hola, {usuario.email_user}. Esta es tu primera vez en el sistema.
            </span>
          </div>
          <p className="text-muted-foreground">
            Por favor, ingresa tu contraseña actual (la temporal) y establece una
            nueva contraseña.
          </p>
        </CardContent>
      </Card>

      <ChangePasswordForm />
    </div>
  )
}