"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

import { SidebarNav } from "@/components/layout/sidebar-nav"
import { UserNav } from "@/components/layout/user-nav"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { findModuleByPath, getModulesForRole } from "@/config/modules"

type HeaderProps = {
  role?: string
  userEmail?: string | null
}

export function Header({ role, userEmail }: HeaderProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const modules = React.useMemo(() => getModulesForRole(role), [role])

  const { module, submodule } = findModuleByPath(pathname)
  const sectionTitle = submodule?.title ?? module?.title ?? "Panel"

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label="Abrir menú de navegación"
            />
          }
        >
          <Menu />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 gap-0 p-0" showCloseButton={false}>
          <div className="flex h-14 items-center border-b px-4">
            <SheetTitle className="text-sm font-semibold tracking-tight">
              hsse administracion
            </SheetTitle>
            <SheetDescription className="sr-only">
              Menú de módulos del sistema
            </SheetDescription>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <SidebarNav
              modules={modules}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-col">
        {module && submodule && (
          <span className="truncate text-xs text-muted-foreground">
            {module.title}
          </span>
        )}
        <h1 className="truncate text-sm font-semibold leading-tight">
          {sectionTitle}
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <UserNav userEmail={userEmail} />
      </div>
    </header>
  )
}
