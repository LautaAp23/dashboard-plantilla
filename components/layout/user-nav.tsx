"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { ChevronDown, LogOut, UserRound } from "lucide-react"

import { useConfirm } from "@/hooks/use-confirm"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

type UserNavProps = {
  userEmail?: string | null
}

export function UserNav({ userEmail }: UserNavProps) {
  const { confirm, ConfirmDialog } = useConfirm()
  const initial = userEmail?.charAt(0).toUpperCase() ?? "?"

  async function handleSignOut() {
    const ok = await confirm({
      title: "Cerrar sesión",
      description: "¿Seguro que querés cerrar sesión?",
      confirmLabel: "Cerrar sesión",
      variant: "destructive",
    })
    if (ok) signOut({ callbackUrl: "/login" })
  }

  return (
    <>
      {ConfirmDialog}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" className="gap-2 rounded-full pl-2" />
          }
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initial}
          </span>
          <span className="hidden max-w-48 truncate sm:inline">
            {userEmail}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <p className="text-xs text-muted-foreground">Sesión iniciada como</p>
              <p className="truncate text-sm font-medium text-foreground">
                {userEmail}
              </p>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/cuenta" />}>
            <UserRound />
            Mi cuenta
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOut />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
