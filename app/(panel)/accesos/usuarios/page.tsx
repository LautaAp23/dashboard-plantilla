import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { notFound } from "next/navigation"
import { z } from "zod"

import { authOptions } from "@/lib/auth"

import { UsuariosClient } from "./usuarios-client"

export const metadata: Metadata = {
  title: "Usuarios | hsse administracion",
}

const paramsSchema = z.object({
  q: z.string().trim().max(120).optional(),
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  estado: z.enum(["activos", "inactivos", "todos"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  por: z.coerce.number().int().min(1).max(100).optional(),
})

type SearchParams = Promise<Record<string, string | string[] | undefined>>

/**
 * Contenedor del módulo de usuarios.
 *
 * Decisiones de arquitectura (migración a capas + endpoints HTTP):
 * - Este server component solo valida la sesión/rol (protección navegable)
 *   y pasa los filtros al client. La protección de datos también la aplica
 *   cada route handler de /api/usuarios (401/403).
 * - La fuente de datos de la tabla ya no sale de acá (server action/prisma):
 *   UsuariosClient la carga vía hook → GET /api/usuarios.
 */
export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.esAdmin) {
    notFound()
  }

  const rawParams = await searchParams
  const parsed = paramsSchema.safeParse(rawParams)
  const filtros = parsed.data ?? {}

  const usuarioActualId = session.user.id

  return (
    <UsuariosClient
      usuarioActualId={usuarioActualId}
      filtros={{
        q: filtros.q ?? "",
        desde: filtros.desde ?? "",
        hasta: filtros.hasta ?? "",
        estado: filtros.estado ?? "activos",
        page: filtros.page ?? 1,
        porPagina: filtros.por ?? 10,
      }}
    />
  )
}
