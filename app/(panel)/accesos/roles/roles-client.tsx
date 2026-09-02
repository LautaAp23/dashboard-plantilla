"use client"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import type { RolListado } from "@/lib/roles/queries"
import { useRoles } from "@/hooks/useRoles"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useConfirm } from "@/hooks/use-confirm"

import { RolForm } from "./rol-form"

type FiltrosEstado = "activos" | "inactivos" | "todos"

type FiltrosUrl = {
  q: string
  estado: FiltrosEstado
  page: number
  porPagina: number
}

const OPCIONES_ESTADO: { valor: FiltrosEstado; label: string }[] = [
  { valor: "activos", label: "Activos" },
  { valor: "inactivos", label: "Inactivos" },
  { valor: "todos", label: "Todos" },
]

const POR_PAGINA_OPCIONES = [10, 20, 50]

function formatearFecha(valor: Date | string | null | undefined): string {
  if (!valor) return "—"
  return new Date(valor).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

function construirPaginas(page: number, totalPaginas: number): (number | "…")[] {
  if (totalPaginas <= 7) {
    return Array.from({ length: totalPaginas }, (_, i) => i + 1)
  }

  const paginas = new Set<number>([1, totalPaginas, page - 1, page, page + 1])
  const ordenadas = [...paginas]
    .filter((p) => p >= 1 && p <= totalPaginas)
    .sort((a, b) => a - b)

  return ordenadas.flatMap((p, i) => {
    const anterior = ordenadas[i - 1]
    const conEspacio = anterior !== undefined && p - anterior > 1
    return conEspacio ? [("…" as const), p] : [p]
  })
}

type RolesClientProps = {
  filtros: FiltrosUrl
}

export function RolesClient({ filtros }: RolesClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { confirm, ConfirmDialog } = useConfirm()

  const filtrosQuery = {
    q: filtros.q,
    estado: filtros.estado,
    page: filtros.page,
    por: filtros.porPagina,
  }

  const {
    data,
    cargando,
    errorLista,
    crearRol,
    actualizarRol,
    darDeBaja,
    reactivar,
    accionPendiente,
  } = useRoles(filtrosQuery)

  const [busquedaLocal, setBusquedaLocal] = useState(filtros.q)
  const [prevQ, setPrevQ] = useState(filtros.q)

  // Sincroniza el input con el valor de la URL.
  if (prevQ !== filtros.q) {
    setPrevQ(filtros.q)
    setBusquedaLocal(filtros.q)
  }
  const [crearAbierto, setCrearAbierto] = useState(false)
  const [editar, setEditar] = useState<RolListado | null>(null)

  // Los errores del listado se muestran como notificación, no arriba de la card.
  useEffect(() => {
    if (errorLista) {
      toast.error(errorLista)
    }
  }, [errorLista])

  const navegar = useCallback(
    (cambios: Partial<FiltrosUrl>) => {
      const nuevo = { ...filtros, ...cambios }
      const params = new URLSearchParams()

      if (nuevo.q) params.set("q", nuevo.q)
      if (nuevo.estado !== "activos") params.set("estado", nuevo.estado)
      if (nuevo.page > 1) params.set("page", String(nuevo.page))
      if (nuevo.porPagina !== 10) params.set("por", String(nuevo.porPagina))

      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [filtros, pathname, router]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (busquedaLocal !== filtros.q) {
        navegar({ q: busquedaLocal, page: 1 })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [busquedaLocal, filtros.q, navegar])

  function limpiarFiltros() {
    setBusquedaLocal("")
    navegar({ q: "", estado: "activos", page: 1 })
  }

  const hayFiltros = Boolean(
    filtros.q || filtros.estado !== "activos" || filtros.page > 1 || filtros.porPagina !== 10
  )

  async function manejarBaja(rol: RolListado) {
    const ok = await confirm({
      title: "Dar de baja rol",
      description: `¿Seguro que querés dar de baja el rol "${rol.nombre_rol}"? Los usuarios asignados conservarán el rol pero quedará inactivo.`,
      confirmLabel: "Dar de baja",
      variant: "destructive",
    })
    if (!ok) return

    const resultado = await darDeBaja(rol.id_rol)
    if (!resultado.success) {
      toast.error(resultado.error ?? "No se pudo dar de baja")
      return
    }
    toast.success("Rol dado de baja")
  }

  async function manejarReactivar(rol: RolListado) {
    const ok = await confirm({
      title: "Reactivar rol",
      description: `¿Seguro que querés reactivar el rol "${rol.nombre_rol}"?`,
      confirmLabel: "Reactivar",
    })
    if (!ok) return

    const resultado = await reactivar(rol.id_rol)
    if (!resultado.success) {
      toast.error(resultado.error ?? "No se pudo reactivar")
      return
    }
    toast.success("Rol reactivado")
  }

  const dataLista = data ?? {
    roles: [],
    total: 0,
    page: filtros.page,
    porPagina: filtros.porPagina,
    totalPaginas: 1,
  }

  const paginas = useMemo(
    () => construirPaginas(dataLista.page, dataLista.totalPaginas),
    [dataLista.page, dataLista.totalPaginas]
  )

  const desdeMostrado =
    dataLista.total === 0 ? 0 : (dataLista.page - 1) * dataLista.porPagina + 1
  const hastaMostrado = Math.min(
    dataLista.page * dataLista.porPagina,
    dataLista.total
  )

  return (
    <>
      {ConfirmDialog}

      <Card className="w-full">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShieldCheckIcon />
              Roles
            </CardTitle>
            <CardDescription>
              Administración de roles del sistema
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setCrearAbierto(true)}>
              <PlusIcon />
              Nuevo rol
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-52 flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre de rol…"
                className="pl-9"
                value={busquedaLocal}
                onChange={(evento) => setBusquedaLocal(evento.target.value)}
              />
            </div>

            <div
              role="group"
              aria-label="Estado del rol"
              className="flex items-center gap-1 rounded-full border border-input bg-background p-1"
            >
              {OPCIONES_ESTADO.map((opcion) => (
                <button
                  key={opcion.valor}
                  type="button"
                  data-activo={filtros.estado === opcion.valor}
                  onClick={() => navegar({ estado: opcion.valor, page: 1 })}
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors data-[activo=true]:bg-primary data-[activo=true]:text-primary-foreground hover:text-foreground"
                >
                  {opcion.label}
                </button>
              ))}
            </div>

            {hayFiltros && (
              <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                <RotateCcwIcon />
                Limpiar
              </Button>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border">
            {cargando ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creado el</TableHead>
                    <TableHead>Creado por</TableHead>
                    <TableHead className="text-center">Usuarios</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataLista.roles.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No se encontraron roles con los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dataLista.roles.map((rol) => (
                      <TableRow key={rol.id_rol}>
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-2">
                            {rol.nombre_rol}
                            {rol.es_admin && (
                              <Badge variant="default">Administrador</Badge>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rol.estado_rol ? "success" : "muted"}>
                            {rol.estado_rol ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatearFecha(rol.fechayhora_rol)}</TableCell>
                        <TableCell>{rol.usuario_creador}</TableCell>
                        <TableCell className="text-center">
                          {rol._count.usuarios}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button variant="ghost" size="icon-sm" />
                              }
                            >
                              <span className="sr-only">Abrir acciones</span>
                              <MoreHorizontalIcon />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuGroup>
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setEditar(rol)}>
                                  <PencilIcon />
                                  Editar
                                </DropdownMenuItem>
                                {rol.estado_rol ? (
                                  <DropdownMenuItem
                                    variant="destructive"
                                    disabled={
                                      rol.es_admin ||
                                      accionPendiente === rol.id_rol
                                    }
                                    onClick={() => manejarBaja(rol)}
                                  >
                                    {accionPendiente === rol.id_rol ? (
                                      <Spinner />
                                    ) : (
                                      <Trash2Icon />
                                    )}
                                    Dar de baja
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    disabled={accionPendiente === rol.id_rol}
                                    onClick={() => manejarReactivar(rol)}
                                  >
                                    {accionPendiente === rol.id_rol ? (
                                      <Spinner />
                                    ) : (
                                      <RotateCcwIcon />
                                    )}
                                    Reactivar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                Mostrando {desdeMostrado}–{hastaMostrado} de {dataLista.total}{" "}
                {dataLista.total === 1 ? "rol" : "roles"}
              </span>

              <label className="flex items-center gap-2">
                <span className="text-xs">Por página</span>
                <select
                  value={filtros.porPagina}
                  onChange={(evento) =>
                    navegar({
                      porPagina: Number(evento.target.value),
                      page: 1,
                    })
                  }
                  className="rounded-lg border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  {POR_PAGINA_OPCIONES.map((cantidad) => (
                    <option key={cantidad} value={cantidad}>
                      {cantidad}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={dataLista.page <= 1}
                onClick={() => navegar({ page: dataLista.page - 1 })}
              >
                <ChevronLeftIcon />
                Anterior
              </Button>

              {paginas.map((pagina, indice) =>
                pagina === "…" ? (
                  <span
                    key={`elipsis-${indice}`}
                    className="px-1 text-muted-foreground"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={pagina}
                    variant={pagina === dataLista.page ? "default" : "ghost"}
                    size="icon-sm"
                    onClick={() => navegar({ page: pagina })}
                  >
                    {pagina}
                  </Button>
                )
              )}

              <Button
                variant="ghost"
                size="sm"
                disabled={dataLista.page >= dataLista.totalPaginas}
                onClick={() => navegar({ page: dataLista.page + 1 })}
              >
                Siguiente
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={crearAbierto}
        onOpenChange={(abierto) => !abierto && setCrearAbierto(false)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Nuevo rol</DialogTitle>
            <DialogDescription>
              Completá el nombre del rol para crear la cuenta de acceso.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70dvh] overflow-y-auto p-4 pt-4 sm:p-6 sm:pt-4">
            <RolForm
              mode="crear"
              crearRol={crearRol}
              actualizarRol={actualizarRol}
              onSuccess={() => {
                setCrearAbierto(false)
                toast.success("Rol creado")
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editar !== null}
        onOpenChange={(abierto) => !abierto && setEditar(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar rol</DialogTitle>
            <DialogDescription>Actualizá el nombre del rol.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70dvh] overflow-y-auto p-4 pt-4 sm:p-6 sm:pt-4">
            {editar && (
              <RolForm
                mode="editar"
                rol={editar}
                crearRol={crearRol}
                actualizarRol={actualizarRol}
                onSuccess={() => {
                  setEditar(null)
                  toast.success("Rol actualizado")
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}