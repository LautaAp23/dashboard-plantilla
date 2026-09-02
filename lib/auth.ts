import bcrypt from "bcryptjs"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

import { getAuthSecret } from "@/lib/auth-secret"
import { prisma } from "@/lib/prisma"
import {
  INACTIVITY_TIMEOUT_SECONDS,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth-config"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Correo electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null
        }

        let user
        try {
          user = await prisma.user.findUnique({
            where: { email_user: credentials.email as string },
            include: { rol: true },
          })
        } catch {
          throw new Error("El servicio no está disponible")
        }

        if (!user || !user.estado_user) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password_user
        )

        if (!isValid) {
          return null
        }

        // Verificar si es el primer inicio de sesión
        const esPrimerLogin = user.primer_login === true

        prisma.user
          .update({
            where: { id: user.id },
            data: { ultima_conexion_user: new Date() },
          })
          .catch(() => undefined)

        // El rol viene de la tabla Rol. "esAdmin" deriva del flag es_admin
        // del rol (solo activo), así sobrevive a renombres.
        return {
          id: user.id,
          email: user.email_user,
          role: user.rol?.nombre_rol,
          esAdmin: Boolean(user.rol?.es_admin && user.rol?.estado_rol),
          primer_login: esPrimerLogin,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  secret: getAuthSecret(),
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      const now = Date.now()

      if (user) {
        token.id = user.id
        token.email = user.email
        const role = (user as { role?: string }).role
        if (role) {
          token.role = role
        }
        const esAdmin = (user as { esAdmin?: boolean }).esAdmin
        if (esAdmin !== undefined) {
          token.esAdmin = esAdmin
        }
        token.lastActivity = now
        token.primer_login = Boolean(
          (user as { primer_login?: boolean }).primer_login
        )
        return token
      }

      const lastActivity = token.lastActivity as number | undefined
      if (!lastActivity || now - lastActivity > INACTIVITY_TIMEOUT_SECONDS * 1000) {
        return {}
      }

      token.lastActivity = now

      // Sincronizar primer_login desde la BD cuando sigue en true. Así, tras
      // un cambio de contraseña exitoso (primer_login pasa a false en BD), el
      // JWT se actualiza y el middleware deja de forzar al usuario a /login.
      try {
        if (token.id && token.primer_login) {
          const usuario = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { primer_login: true },
          })
          if (usuario && !usuario.primer_login) {
            token.primer_login = false
          }
        }
      } catch {
        // Ignora errores de BD: se conserva el valor previo del token.
      }

      return token
    },
    async session({ session, token }) {
      if (token && token.id) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        if (token.role) {
          session.user.role = token.role as string
        }
        if (token.esAdmin !== undefined) {
          session.user.esAdmin = token.esAdmin as boolean
        }
        session.user.primer_login = Boolean(token.primer_login)
      }
      return session
    },
  },
}
