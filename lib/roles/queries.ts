import { prisma } from "@/lib/prisma"
import { Prisma } from "@/app/generated/prisma/client"

const ROL_SELECT = {
  id_rol: true,
  nombre_rol: true,
  es_admin: true,
  fechayhora_rol: true,
  estado_rol: true,
  usuario_creador: true,
  _count: {
    select: { usuarios: true },
  },
} satisfies Prisma.RolSelect

export type RolListado = Prisma.RolGetPayload<{
  select: typeof ROL_SELECT
}>

export type ListarRolesParams = {
  /** Búsqueda por nombre de rol. */
  q?: string
  /** undefined = sin filtro (todos). El default "solo activos" lo resuelve el route handler. */
  estado?: boolean
  page?: number
  porPagina?: number
}

export type ListarRolesResult = {
  roles: RolListado[]
  total: number
  page: number
  porPagina: number
  totalPaginas: number
}

/** Detalle de un rol por id (con cantidad de usuarios). */
export async function obtenerRol(id: string): Promise<RolListado | null> {
  return prisma.rol.findUnique({ where: { id_rol: id }, select: ROL_SELECT })
}

export async function listarRoles(
  params: ListarRolesParams
): Promise<ListarRolesResult> {
  const q = params.q?.trim()
  const page = Math.max(1, params.page ?? 1)
  const porPagina = Math.min(100, Math.max(1, params.porPagina ?? 10))
  const estado = params.estado

  const where: Prisma.RolWhereInput = {
    ...(estado !== undefined ? { estado_rol: estado } : {}),
    ...(q ? { nombre_rol: { contains: q, mode: "insensitive" } } : {}),
  }

  const [roles, total] = await Promise.all([
    prisma.rol.findMany({
      where,
      select: ROL_SELECT,
      orderBy: { fechayhora_rol: "desc" },
      skip: (page - 1) * porPagina,
      take: porPagina,
    }),
    prisma.rol.count({ where }),
  ])

  return {
    roles,
    total,
    page,
    porPagina,
    totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
  }
}