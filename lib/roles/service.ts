import { prisma } from "@/lib/prisma"
import {
  listarRoles,
  obtenerRol as obtenerRolQuery,
  type ListarRolesParams,
  type ListarRolesResult,
  type RolListado,
} from "@/lib/roles/queries"
import {
  actualizarRolSchema,
  crearRolSchema,
  type ActualizarRolInput,
  type CrearRolInput,
} from "@/lib/roles/schemas"
import {
  DominioError,
  type SessionUser,
} from "@/lib/types/common"

/**
 * Capa de lógica de negocio del módulo de roles.
 * Flujo: route handler → servicio → queries/Prisma.
 */

function primerMensaje(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Datos inválidos"
}

/** Listado con filtros, búsqueda y paginación → delega a queries.ts. */
export async function listarRolesService(
  params: ListarRolesParams
): Promise<ListarRolesResult> {
  return listarRoles(params)
}

/** Detalle de un rol (NO_ENCONTRADO si no existe). */
export async function obtenerRol(
  id: string
): Promise<Awaited<ReturnType<typeof obtenerRolQuery>>> {
  const rol = await obtenerRolQuery(id)
  if (!rol) {
    throw new DominioError("NO_ENCONTRADO", "El rol no existe")
  }
  return rol
}

/** Valida que no exista otro rol con el mismo nombre (insensible a mayúsculas). */
async function validarNombreDisponible(
  nombreRol: string,
  excluirId?: string
): Promise<void> {
  const existente = await prisma.rol.findFirst({
    where: {
      nombre_rol: { equals: nombreRol, mode: "insensitive" },
      ...(excluirId ? { NOT: { id_rol: excluirId } } : {}),
    },
    select: { id_rol: true },
  })
  if (existente) {
    throw new DominioError(
      "DUPLICADO_NOMBRE",
      "Ya existe un rol con ese nombre"
    )
  }
}

/** Crea un rol con trazabilidad del usuario de sesión. */
export async function crearRol(
  input: CrearRolInput,
  sessionUser: SessionUser
): Promise<string> {
  const parsed = crearRolSchema.safeParse(input)
  if (!parsed.success) {
    throw new DominioError("VALIDACION", primerMensaje(parsed.error))
  }
  const { nombre_rol } = parsed.data

  await validarNombreDisponible(nombre_rol)

  const creado = await prisma.rol.create({
    data: {
      nombre_rol,
      usuario_creador: sessionUser.email,
    },
    select: { id_rol: true },
  })

  return creado.id_rol
}

/** Actualiza un rol validando duplicados (excluyendo el id actual). */
export async function actualizarRol(
  id: string,
  input: ActualizarRolInput
): Promise<void> {
  const parsed = actualizarRolSchema.safeParse(input)
  if (!parsed.success) {
    throw new DominioError("VALIDACION", primerMensaje(parsed.error))
  }
  const { nombre_rol } = parsed.data

  await Promise.all([obtenerRol(id), validarNombreDisponible(nombre_rol, id)])

  await prisma.rol.update({
    where: { id_rol: id },
    data: { nombre_rol },
  })
}

/** Devuelve el rol o lanza ROL_PROTEGIDO si es el rol Administrador. */
async function protegerRolAdministrador(id: string): Promise<RolListado> {
  const rol = await obtenerRolQuery(id)
  if (!rol) {
    throw new DominioError("NO_ENCONTRADO", "El rol no existe")
  }
  if (rol.es_admin) {
    throw new DominioError(
      "ROL_PROTEGIDO",
      "El rol Administrador no se puede dar de baja"
    )
  }
  return rol
}

/** Baja lógica: estado_rol = false. NO registra quién/mencionó la modificación. */
export async function bajaRol(id: string): Promise<void> {
  await protegerRolAdministrador(id)
  await prisma.rol.update({
    where: { id_rol: id },
    data: { estado_rol: false },
  })
}

/** Reactivación de un rol dado de baja. */
export async function reactivarRol(id: string): Promise<void> {
  await obtenerRol(id)
  await prisma.rol.update({
    where: { id_rol: id },
    data: { estado_rol: true },
  })
}