"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import type { ModuleItem } from "@/config/modules"

type SidebarNavProps = {
  modules: ModuleItem[]
  onNavigate?: () => void
  className?: string
}

export function SidebarNav({ modules, onNavigate, className }: SidebarNavProps) {
  const pathname = usePathname()
  const [openOverrides, setOpenOverrides] = useState<Record<string, boolean>>({})

  function isActive(href: string, exact = false) {
    if (exact || href === "/home") return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  function setOpen(href: string, open: boolean) {
    setOpenOverrides((prev) => ({ ...prev, [href]: open }))
  }

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {modules.map((item) =>
        item.items?.length ? (
          <Collapsible
            key={item.href}
            open={openOverrides[item.href] ?? isActive(item.href)}
            onOpenChange={(open) => setOpen(item.href, open)}
          >
            <CollapsibleTrigger
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30 aria-expanded:bg-muted",
                isActive(item.href)
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.title}
              <ChevronDown className="ml-auto size-4 shrink-0 transition-transform data-panel-open:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="grid transition-[grid-template-rows,opacity] duration-200 ease-out data-closed:grid-rows-[0fr] data-open:grid-rows-[1fr] data-closed:opacity-0 data-open:opacity-100 starting:data-open:grid-rows-[0fr] starting:data-open:opacity-0">
              <div className="overflow-hidden">
                <ul className="mt-1 flex flex-col gap-0.5 border-l pl-4 ml-5">
                {item.items.map((sub) => (
                  <li key={sub.href}>
                    <Link
                      href={sub.href}
                      onClick={onNavigate}
                      aria-current={isActive(sub.href, true) ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30",
                        isActive(sub.href, true)
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      <sub.icon className="size-3.5 shrink-0" />
                      {sub.title}
                    </Link>
                  </li>
                ))}
                </ul>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30",
              isActive(item.href)
                ? "bg-muted text-foreground"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.title}
          </Link>
        )
      )}
    </nav>
  )
}
