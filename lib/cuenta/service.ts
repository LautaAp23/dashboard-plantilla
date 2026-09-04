import bcrypt from "bcryptjs"

import { prisma } from "@/lib/prisma"
import { DominioError, type SessionUser } from "@/lib/types/common"
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/cuenta/schemas"

const BCRYPT_SALT = 10

/**
 * Capa de lógica de negocio para cambio de contraseña.
 * Flujo: route handler → servicio → Prisma.
 * - No importa next-auth: recibe el usuario de sesión como parámetro.
 * - Lanza DominioError tipado que el route handler traduce a status HTTP.
 */
export async function changePasswordService(
  input: ChangePasswordInput,
  sessionUser: SessionUser
): Promise<void> {
  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) {
    throw new DominioError("VALIDACION", parsed.error.issues[0]?.message ?? "Datos inválidos")
  }

  const { currentPassword, newPassword } = parsed.data

  let user
  try {
    user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    })
  } catch {
    throw new DominioError("VALIDACION", "El servicio no está disponible")
  }

  if (!user) {
    throw new DominioError("NO_ENCONTRADO", "El usuario no existe")
  }

  const isValid = await bcrypt.compare(currentPassword, user.password_user)
  if (!isValid) {
    throw new DominioError("VALIDACION", "La contraseña actual es incorrecta")
  }

  if (await bcrypt.compare(newPassword, user.password_user)) {
    throw new DominioError("VALIDACION", "La nueva contraseña debe ser distinta a la actual")
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_user: await bcrypt.hash(newPassword, BCRYPT_SALT),
        primer_login: false,
        usuario_modificador: sessionUser.id,
      },
    })
  } catch {
    throw new DominioError("VALIDACION", "No se pudo actualizar la contraseña")
  }
}

// Aliases para compatibilidad semántica
export const changePassword = changePasswordService
