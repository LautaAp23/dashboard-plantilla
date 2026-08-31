import { prisma } from "@/lib/prisma"
import { Prisma } from "@/app/generated/prisma/client"

const USUARIO_SELECT = {
  id: true,
  email_user: true,
  id_rol: true,
  rol: {
    select: {
      id_rol: true,
      nombre_rol: true,
      es_admin: true,
      estado_rol: true,
    },
  },
  nombreyapellido_user: true,
  dni_user: true,
  direccion_user: true,
  telefono_user: true,
  fechayhora_user: true,
  ultima_conexion_user: true,
  usuario_creador: true,
  usuario_modificador: true,
  fechayhora_modificacion: true,
  estado_user: true,
} satisfies Prisma.UserSelect

export type UsuarioListado = Prisma.UserGetPayload<{
  select: typeof USUARIO_SELECT
}>

export type ListarUsuariosParams = {
  /** Búsqueda por nombre y apellido, DNI o email. */
  q?: string
  /** Filtro por rango de fechas (fechayhora_user). */
  desde?: Date
  hasta?: Date
  /**
   * Filtro por estado. `undefined` = sin filtro (todos).
   * El default "solo activos" lo resuelve el route handler.
   */
  estado_user?: boolean
  page?: number
  porPagina?: number
}

export type ListarUsuariosResult = {
  usuarios: UsuarioListado[]
  total: number
  page: number
  porPagina: number
  totalPaginas: number
}

/** Detalle de un usuario por id (sin password_user). */
export async function obtenerUsuario(id: string): Promise<UsuarioListado | null> {
  return prisma.user.findUnique({ where: { id }, select: USUARIO_SELECT })
}

function finDelDia(fecha: Date): Date {
  const copia = new Date(fecha)
  copia.setHours(23, 59, 59, 999)
  return copia
}

export async function listarUsuarios(
  params: ListarUsuariosParams
): Promise<ListarUsuariosResult> {
  const q = params.q?.trim()
  const page = Math.max(1, params.page ?? 1)
  const porPagina = Math.min(100, Math.max(1, params.porPagina ?? 10))
  // undefined = sin filtro de estado (activos + inactivos). El route handler
  // resuelve el default "solo activos" cuando no se envía el parámetro.
  const estado = params.estado_user

  const where: Prisma.UserWhereInput = {
    ...(estado !== undefined ? { estado_user: estado } : {}),
    ...(q
      ? {
          OR: [
            { nombreyapellido_user: { contains: q, mode: "insensitive" } },
            { dni_user: { contains: q, mode: "insensitive" } },
            { email_user: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(params.desde || params.hasta
      ? {
          fechayhora_user: {
            ...(params.desde ? { gte: params.desde } : {}),
            ...(params.hasta ? { lte: finDelDia(params.hasta) } : {}),
          },
        }
      : {}),
  }

  const [usuarios, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USUARIO_SELECT,
      orderBy: { fechayhora_user: "desc" },
      skip: (page - 1) * porPagina,
      take: porPagina,
    }),
    prisma.user.count({ where }),
  ])

  return {
    usuarios,
    total,
    page,
    porPagina,
    totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
  }
}