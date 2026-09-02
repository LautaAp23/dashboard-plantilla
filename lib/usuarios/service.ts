import bcrypt from "bcryptjs"

import { Prisma } from "@/app/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import {
  obtenerUsuario as obtenerUsuarioQuery,
  listarUsuarios,
  type ListarUsuariosParams,
  type ListarUsuariosResult,
} from "@/lib/usuarios/queries"
import {
  actualizarUsuarioSchema,
  crearUsuarioSchema,
  normalizarOpcional,
  type ActualizarUsuarioInput,
  type CrearUsuarioInput,
} from "@/lib/usuarios/schemas"
import { generarPassword } from "@/lib/utils"
import { enviarEmail } from "@/lib/mail"
import {
  DominioError,
  type SessionUser,
} from "@/lib/usuarios/types"

/**
 * Capa de lógica de negocio del módulo de usuarios.
 * Flujo: route handler → servicio → queries/Prisma.
 *
 * - No importa next-auth: recibe el usuario de sesión como parámetro simple.
 * - Lanza DominioError tipado que el route handler traduce a status HTTP.
 * - Centraliza las reglas de negocio para no duplicarlas entre frontend y backend.
 */
const BCRYPT_SALT = 10

function primerMensaje(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Datos inválidos"
}

/** Falla si el rol referenciado no existe o está dado de baja. */
async function validarRolActivo(idRol: string): Promise<void> {
  const rol = await prisma.rol.findUnique({ where: { id_rol: idRol } })
  if (!rol || !rol.estado_rol) {
    throw new DominioError(
      "VALIDACION",
      "El rol seleccionado no existe o está inactivo"
    )
  }
}

/** Listado con filtros, búsqueda y paginación → delega a queries.ts (acceso a datos). */
export async function listarUsuariosService(
  params: ListarUsuariosParams
): Promise<ListarUsuariosResult> {
  return listarUsuarios(params)
}

/** Detalle de un usuario (sin password_user). */
export async function obtenerUsuario(
  id: string
): Promise<Awaited<ReturnType<typeof obtenerUsuarioQuery>>> {
  const usuario = await obtenerUsuarioQuery(id)
  if (!usuario) {
    throw new DominioError("NO_ENCONTRADO", "El usuario no existe")
  }
  return usuario
}

/** Crea un usuario validando email/DNI duplicados, generando contraseña y enviando email. */
export async function crearUsuario(
  input: CrearUsuarioInput,
  sessionUser: SessionUser
): Promise<string> {
  const parsed = crearUsuarioSchema.safeParse(input)
  if (!parsed.success) {
    throw new DominioError("VALIDACION", primerMensaje(parsed.error))
  }
  const datos = parsed.data

  const [, existente] = await Promise.all([
    validarRolActivo(datos.id_rol),
    prisma.user.findFirst({
      where: {
        OR: [{ email_user: datos.email_user }, { dni_user: datos.dni_user }],
      },
      select: { email_user: true, dni_user: true },
    }),
  ])
  if (existente) {
    if (existente.email_user === datos.email_user) {
      throw new DominioError(
        "DUPLICADO_EMAIL",
        "Ya existe un usuario con ese email"
      )
    }
    throw new DominioError("DUPLICADO_DNI", "Ya existe un usuario con ese DNI")
  }

  const passwordTemporal = generarPassword(12)
  const passwordHash = await bcrypt.hash(passwordTemporal, BCRYPT_SALT)

  const creado = await prisma.user.create({
    data: {
      email_user: datos.email_user,
      password_user: passwordHash,
      rol: { connect: { id_rol: datos.id_rol } },
      nombreyapellido_user: datos.nombreyapellido_user,
      dni_user: datos.dni_user,
      direccion_user: normalizarOpcional(datos.direccion_user),
      telefono_user: normalizarOpcional(datos.telefono_user),
      // Trazabilidad: se guarda el ID del usuario de sesión, nunca email/nombre
      // (regla "sin NULLs" y trazabilidad estable). Al crear se inicializa también
      // usuario_modificador para que nunca quede en NULL.
      usuario_creador: sessionUser.id,
      usuario_modificador: sessionUser.id,
      primer_login: true,
    },
    select: { id: true, email_user: true },
  })

  // Enviar contraseña generada por email
  await enviarEmail({
    to: creado.email_user,
    subject: "Bienvenido al sistema - Contraseña temporal",
    html: `
      <h3>Hola ${datos.nombreyapellido_user}</h3>
      <p>Tu cuenta ha sido creada exitosamente. Tu contraseña temporal es: <strong>${passwordTemporal}</strong></p>
      <p>Al iniciar sesión por primera vez, el sistema te pedirá que la cambies.</p>
    `,
    text: `Hola ${datos.nombreyapellido_user}. Tu contraseña temporal es: ${passwordTemporal}. Al iniciar sesión por primera vez, el sistema te pedirá que la cambies.`,
  })

  return creado.id
}

/** Actualiza un usuario validando duplicados (excluyendo el id actual). */
export async function actualizarUsuario(
  id: string,
  input: ActualizarUsuarioInput,
  sessionUser: SessionUser
): Promise<void> {
  const parsed = actualizarUsuarioSchema.safeParse(input)
  if (!parsed.success) {
    throw new DominioError("VALIDACION", primerMensaje(parsed.error))
  }
  const datos = parsed.data

  await validarRolActivo(datos.id_rol)

  const conflicto = await prisma.user.findFirst({
    where: {
      OR: [{ email_user: datos.email_user }, { dni_user: datos.dni_user }],
      NOT: { id },
    },
    select: { email_user: true, dni_user: true },
  })
  if (conflicto) {
    if (conflicto.email_user === datos.email_user) {
      throw new DominioError(
        "DUPLICADO_EMAIL",
        "Ya existe otro usuario con ese email"
      )
    }
    throw new DominioError("DUPLICADO_DNI", "Ya existe otro usuario con ese DNI")
  }

  // Solo se pickean campos permitidos. Los campos de trazabilidad se fuerzan
  // acá internamente y el input del cliente nunca se propaga tal cual.
  const data: Prisma.UserUpdateInput = {
    email_user: datos.email_user,
    nombreyapellido_user: datos.nombreyapellido_user,
    dni_user: datos.dni_user,
    rol: { connect: { id_rol: datos.id_rol } },
    direccion_user: normalizarOpcional(datos.direccion_user),
    telefono_user: normalizarOpcional(datos.telefono_user),
    // Trazabilidad: se guarda el ID del usuario de sesión, nunca email/nombre.
    usuario_modificador: sessionUser.id,
  }

  try {
    // fechayhora_modificacion se actualiza automáticamente (@updatedAt).
    await prisma.user.update({ where: { id }, data })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new DominioError("NO_ENCONTRADO", "El usuario no existe")
    }
    throw error
  }
}

async function setEstado(
  userId: string,
  estado: boolean,
  sessionUser: SessionUser
): Promise<void> {
  // No se permite que el usuario modifique su propio estado.
  if (userId === sessionUser.id) {
    throw new DominioError(
      "AUTO_MODIFICACION",
      "No podés modificar tu propio estado de usuario"
    )
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        estado_user: estado,
        usuario_modificador: sessionUser.id,
      },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new DominioError("NO_ENCONTRADO", "El usuario no existe")
    }
    throw error
  }
}

/** Baja lógica: estado_user = false + trazabilidad del modificador. */
export async function bajaUsuario(
  userId: string,
  sessionUser: SessionUser
): Promise<void> {
  await setEstado(userId, false, sessionUser)
}

/** Reactivación de un usuario dado de baja. */
export async function reactivarUsuario(
  userId: string,
  sessionUser: SessionUser
): Promise<void> {
  await setEstado(userId, true, sessionUser)
}
