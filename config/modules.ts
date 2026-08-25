import {
  Circle,
  House,
  ShoppingCart,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import type { Role } from "@/app/generated/prisma/client"

export type ModuleItem = {
  title: string
  href: string
  icon: LucideIcon
  roles?: Role[]
  items?: ModuleItem[]
}

const ADMIN_ONLY: Role[] = ["ADMIN"] as Role[]

export const MODULES: ModuleItem[] = [
  {
    title: "Inicio",
    href: "/home",
    icon: House,
  },
  {
    title: "Compras",
    href: "/compras",
    icon: ShoppingCart,
    roles: ADMIN_ONLY,
    items: [
      { title: "Submódulo 1", href: "/compras/submodulo-1", icon: Circle },
      { title: "Submódulo 2", href: "/compras/submodulo-2", icon: Circle },
      { title: "Submódulo 3", href: "/compras/submodulo-3", icon: Circle },
    ],
  },
  {
    title: "Ventas",
    href: "/ventas",
    icon: TrendingUp,
    roles: ADMIN_ONLY,
    items: [
      { title: "Submódulo 1", href: "/ventas/submodulo-1", icon: Circle },
      { title: "Submódulo 2", href: "/ventas/submodulo-2", icon: Circle },
      { title: "Submódulo 3", href: "/ventas/submodulo-3", icon: Circle },
    ],
  },
  {
    title: "Sueldos",
    href: "/sueldos",
    icon: Wallet,
    roles: ADMIN_ONLY,
    items: [
      { title: "Submódulo 1", href: "/sueldos/submodulo-1", icon: Circle },
      { title: "Submódulo 2", href: "/sueldos/submodulo-2", icon: Circle },
      { title: "Submódulo 3", href: "/sueldos/submodulo-3", icon: Circle },
    ],
  },
]

function hasAccess(item: ModuleItem, role?: string): boolean {
  return !item.roles || (!!role && (item.roles as string[]).includes(role))
}

export function getModulesForRole(role?: string): ModuleItem[] {
  return MODULES.filter((item) => hasAccess(item, role)).map((item) => ({
    ...item,
    items: item.items?.filter((sub) => hasAccess(sub, role)),
  }))
}

export function findModuleByPath(pathname: string): {
  module?: ModuleItem
  submodule?: ModuleItem
} {
  for (const item of MODULES) {
    if (item.href === pathname) return { module: item }

    for (const sub of item.items ?? []) {
      if (pathname === sub.href || pathname.startsWith(`${sub.href}/`)) {
        return { module: item, submodule: sub }
      }
    }

    if (pathname.startsWith(`${item.href}/`)) {
      return { module: item }
    }
  }

  return {}
}

export function isRouteAllowed(pathname: string, role?: string): boolean {
  const { module, submodule } = findModuleByPath(pathname)

  if (submodule && !hasAccess(submodule, role)) {
    return false
  }

  if (module && !hasAccess(module, role)) {
    return false
  }

  return true
}
