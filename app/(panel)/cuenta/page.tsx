import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChangePasswordForm } from "@/app/(panel)/cuenta/change-password-form"

export const metadata = {
  title: "Mi cuenta | hsse administracion",
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
}

export default async function CuentaPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h2 className="text-xl font-semibold">Mi cuenta</h2>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Datos de la cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Correo electrónico</span>
            <span className="font-medium">{session?.user?.email}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Rol</span>
            <span className="font-medium">
              {ROLE_LABELS[session?.user?.role ?? ""] ?? session?.user?.role}
            </span>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordForm />
    </div>
  )
}
