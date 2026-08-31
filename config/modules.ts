import {
  Circle,
  House,
  KeyRound,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"

export type ModuleItem = {
  title: string
  href: string
  icon: LucideIcon
  /** Solo visible para usuarios con rol admin (es_admin). */
  adminOnly?: boolean
  items?: ModuleItem[]
}

export const MODULES: ModuleItem[] = [
  {
    title: "Inicio",
    href: "/home",
    icon: House,
  },
  {
    title: "Accesos",
    href: "/accesos",
    icon: KeyRound,
    adminOnly: true,
    items: [
      { title: "Usuarios", href: "/accesos/usuarios", icon: Users },
      { title: "Roles", href: "/accesos/roles", icon: ShieldCheck },
    ],
  },
  {
    title: "Compras",
    href: "/compras",
    icon: ShoppingCart,
    adminOnly: true,
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
    adminOnly: true,
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
    adminOnly: true,
    items: [
      { title: "Submódulo 1", href: "/sueldos/submodulo-1", icon: Circle },
      { title: "Submódulo 2", href: "/sueldos/submodulo-2", icon: Circle },
      { title: "Submódulo 3", href: "/sueldos/submodulo-3", icon: Circle },
    ],
  },
]

function hasAccess(item: ModuleItem, esAdmin: boolean): boolean {
  return !item.adminOnly || esAdmin
}

export function getModulesForRole(esAdmin: boolean): ModuleItem[] {
  return MODULES.filter((item) => hasAccess(item, esAdmin)).map((item) => ({
    ...item,
    items: item.items?.filter((sub) => hasAccess(sub, esAdmin)),
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

export function isRouteAllowed(pathname: string, esAdmin: boolean): boolean {
  const { module, submodule } = findModuleByPath(pathname)

  if (submodule && !hasAccess(submodule, esAdmin)) {
    return false
  }

  if (module && !hasAccess(module, esAdmin)) {
    return false
  }

  return true
}