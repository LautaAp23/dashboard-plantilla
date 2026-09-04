import { z } from "zod"

export const changePasswordSchema = z.strictObject({
  currentPassword: z.string().min(1, "La contraseña actual es obligatoria"),
  newPassword: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
})

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
