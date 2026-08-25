import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata = {
  title: "Inicio | hsse administracion",
}

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">
            Bienvenido, {session?.user?.email}
          </CardTitle>
          <CardDescription>Has iniciado sesión correctamente.</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Seleccioná un módulo del menú lateral para comenzar.
        </CardContent>
      </Card>
    </div>
  )
}
