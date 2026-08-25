import crypto from "node:crypto"

const globalForDev = globalThis as unknown as { __authSecret?: string }

export function getAuthSecret(): string {
  if (process.env.NODE_ENV === "production") {
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error(
        "NEXTAUTH_SECRET es obligatorio en producción. Generá uno con: openssl rand -base64 32"
      )
    }
    return process.env.NEXTAUTH_SECRET
  }

  return (
    globalForDev.__authSecret ??
    (globalForDev.__authSecret = crypto.randomBytes(32).toString("hex"))
  )
}