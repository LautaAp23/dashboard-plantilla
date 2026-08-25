import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { authOptions } from "@/lib/auth"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-gradient-to-tr from-[#187a44] via-[#2FAD67] to-[#5ce092] px-4">
      <h1 className="text-3xl font-semibold text-white drop-shadow-sm">
        Bienvenido, {session.user.email}
      </h1>
      <p className="text-sm text-teal-50/90">
        Has iniciado sesión correctamente.
      </p>
    </main>
  )
}