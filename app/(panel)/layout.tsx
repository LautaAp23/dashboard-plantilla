import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { authOptions } from "@/lib/auth"

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-svh w-full bg-background">
      <Sidebar role={session.user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header role={session.user.role} userEmail={session.user.email} />
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}
