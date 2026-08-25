import bcrypt from "bcryptjs"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

import { getAuthSecret } from "@/lib/auth-secret"
import { prisma } from "@/lib/prisma"

export const INACTIVITY_TIMEOUT_SECONDS = 40 * 60 // 40 minutos

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
            where: { email: credentials.email as string },
          })
        } catch {
          throw new Error("El servicio no está disponible")
        }

        if (!user) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) {
          return null
        }

        return { id: user.id, email: user.email }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: INACTIVITY_TIMEOUT_SECONDS,
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
        token.lastActivity = now
        return token
      }

      const lastActivity = token.lastActivity as number | undefined
      if (!lastActivity || now - lastActivity > INACTIVITY_TIMEOUT_SECONDS * 1000) {
        return {}
      }

      token.lastActivity = now
      return token
    },
    async session({ session, token }) {
      if (token && token.id) {
        session.user.id = token.id as string
        session.user.email = token.email as string
      }
      return session
    },
  },
}
