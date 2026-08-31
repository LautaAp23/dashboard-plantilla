import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"

type FiltrosEstado = "activos" | "inactivos" | "todos"

export const metadata: Metadata = {
  title: "Roles",
}

type PaginaRolesProps = {
  searchParams: Promise<{
    q?: string
    estado?: string
    page?: string
    por?: string
  }>
}

export default async function RolesPage({
  searchParams,
}: PaginaRolesProps) {
  const sesion = await getServerSession(authOptions)
  if (!sesion?.user?.esAdmin) {
    notFound()
  }

  const params = await searchParams
  const estado = ["activos", "inactivos", "todos"].includes(
    params.estado ?? ""
  )
    ? (params.estado as FiltrosEstado)
    : "activos"
  const page = Math.max(1, Math.floor(Number(params.page) || 1))
  const porPagina = Math.min(
    100,
    Math.max(1, Math.floor(Number(params.por) || 10))
  )
  const q = params.q?.trim() ?? ""

  const { RolesClient } = await import("./roles-client")

  return (
    <div className="flex flex-col gap-6">
      <RolesClient
        filtros={{ q, estado, page, porPagina }}
      />
    </div>
  )
}