import type { Metadata } from "next"

import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Iniciar sesión | hsse administracion",
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gradient-to-tr from-[#187a44] via-[#2FAD67] to-[#5ce092] px-4 py-8">
      <LoginForm />
    </main>
  )
}