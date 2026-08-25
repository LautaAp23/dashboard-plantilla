import crypto from "node:crypto"

const globalForDev = globalThis as unknown as { __authSecret?: string }

export function getAuthSecret(): string {
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXTAUTH_SECRET ?? crypto.randomBytes(32).toString("hex")
  }

  return (
    globalForDev.__authSecret ??
    (globalForDev.__authSecret = crypto.randomBytes(32).toString("hex"))
  )
}