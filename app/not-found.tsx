import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
      <h2 className="text-xl font-semibold">Página no encontrada</h2>
      <p className="text-sm text-muted-foreground">
        La página que buscás no existe o fue movida.
      </p>
      <Button variant="outline" render={<Link href="/home" />}>
        Volver al inicio
      </Button>
    </div>
  )
}
