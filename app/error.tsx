"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertTitle>Algo salió mal</AlertTitle>
        <AlertDescription>
          Ocurrió un error inesperado. Volvé a intentar.
          {error.digest ? ` (Código: ${error.digest})` : null}
        </AlertDescription>
      </Alert>
      <Button variant="outline" onClick={reset}>
        Reintentar
      </Button>
    </div>
  )
}
