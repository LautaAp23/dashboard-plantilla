import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

type GlobalForPrisma = typeof globalThis & {
  prisma?: PrismaClient
  pgPool?: Pool
}

const globalForPrisma = globalThis as GlobalForPrisma

function getPool(): Pool {
  if (globalForPrisma.pgPool) return globalForPrisma.pgPool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Pooling optimizado para carga concurrente y serverless/Next.js
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    // Evita acumular conexiones en HMR (dev)
    allowExitOnIdle: true,
  })
  // Log de errores de pool sin crashear el proceso
  pool.on("error", (err: Error) => {
    console.error("[prisma] pool error:", err.message)
  })
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool
  }
  return pool
}

const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaPg(getPool()),
  })

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}