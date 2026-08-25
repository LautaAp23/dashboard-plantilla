"use client"

import Link from "next/link"

import { SidebarNav } from "@/components/layout/sidebar-nav"
import { getModulesForRole } from "@/config/modules"

type SidebarProps = {
  role?: string
}

export function Sidebar({ role }: SidebarProps) {
  const modules = getModulesForRole(role)

  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <Link href="/home" className="text-sm font-semibold tracking-tight">
          hsse administracion
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <SidebarNav modules={modules} />
      </div>
    </aside>
  )
}
