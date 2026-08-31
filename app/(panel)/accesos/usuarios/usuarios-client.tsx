"use client"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Columns3Icon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import type { UsuarioListado } from "@/lib/usuarios/queries"
import { useUsuarios } from "@/hooks/useUsuarios"
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
  DropdownMenuCheckboxItem,
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

import { UsuarioForm } from "./usuario-form"

type FiltrosEstado = "activos" | "inactivos" | "todos"

type FiltrosUrl = {
  q: string
  desde: string
  hasta: string
  estado: FiltrosEstado
  page: number
  porPagina: number
}

const COLUMNAS = [
  { id: "nombreyapellido_user", label: "Nombre y apellido" },
  { id: "dni_user", label: "DNI" },
  { id: "email_user", label: "Email" },
  { id: "role_user", label: "Rol" },
  { id: "estado_user", label: "Estado" },
  { id: "fechayhora_user", label: "Fecha de alta" },
  { id: "ultima_conexion_user", label: "Última conexión" },
  { id: "usuario_creador", label: "Creado por" },
  { id: "usuario_modificador", label: "Modificado por" },
  { id: "fechayhora_modificacion", label: "Fecha de modificación" },
] as const

type ColumnaId = (typeof COLUMNAS)[number]["id"]

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

type UsuariosClientProps = {
  filtros: FiltrosUrl
  usuarioActualId: string
}

export function UsuariosClient({
  filtros,
  usuarioActualId,
}: UsuariosClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { confirm, ConfirmDialog } = useConfirm()

  const {
    data,
    cargando,
    errorLista,
    listarUsuarios,
    crearUsuario,
    actualizarUsuario,
    darDeBaja,
    reactivar,
    accionPendiente,
  } = useUsuarios()

  const [columnaVisible, setColumnaVisible] = useState<Set<ColumnaId>>(
    () => new Set(COLUMNAS.map((c) => c.id))
  )
  const [busquedaLocal, setBusquedaLocal] = useState(filtros.q)
  const [prevQ, setPrevQ] = useState(filtros.q)

  // Roles activos para el selector del formulario de usuario.
  const { listarRoles } = useRoles()
  const [roles, setRoles] = useState<
    { id_rol: string; nombre_rol: string; es_admin: boolean }[]
  >([])

  useEffect(() => {
    let activo = true
    listarRoles({ estado: "activos", por: 100 }).then((data) => {
      if (activo && data) {
        setRoles(
          data.roles.map((rol) => ({
            id_rol: rol.id_rol,
            nombre_rol: rol.nombre_rol,
            es_admin: rol.es_admin,
          }))
        )
      }
    })
    return () => {
      activo = false
    }
  }, [listarRoles])

  // Sincroniza el input con el valor de la URL (p. ej. navegación con botón atrás).
  if (prevQ !== filtros.q) {
    setPrevQ(filtros.q)
    setBusquedaLocal(filtros.q)
  }
  const [crearAbierto, setCrearAbierto] = useState(false)
  const [editar, setEditar] = useState<UsuarioListado | null>(null)

  // La tabla se alimenta vía hook → GET /api/usuarios (con los filtros de la URL).
  useEffect(() => {
    listarUsuarios({
      q: filtros.q,
      estado: filtros.estado,
      desde: filtros.desde || undefined,
      hasta: filtros.hasta || undefined,
      page: filtros.page,
      por: filtros.porPagina,
    })
  }, [
    filtros.q,
    filtros.estado,
    filtros.desde,
    filtros.hasta,
    filtros.page,
    filtros.porPagina,
    listarUsuarios,
  ])

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
      if (nuevo.desde) params.set("desde", nuevo.desde)
      if (nuevo.hasta) params.set("hasta", nuevo.hasta)
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
    navegar({ q: "", desde: "", hasta: "", estado: "activos", page: 1 })
  }

  const hayFiltros = Boolean(
    filtros.q ||
      filtros.desde ||
      filtros.hasta ||
      filtros.estado !== "activos" ||
      filtros.page > 1 ||
      filtros.porPagina !== 10
  )

  const alternarColumna = useCallback((id: ColumnaId) => {
    setColumnaVisible((prev) => {
      const nuevo = new Set(prev)
      if (nuevo.has(id)) {
        nuevo.delete(id)
      } else {
        nuevo.add(id)
      }
      return nuevo
    })
  }, [])

  const verColumna = useCallback(
    (id: ColumnaId) => columnaVisible.has(id),
    [columnaVisible]
  )

  async function manejarBaja(usuario: UsuarioListado) {
    const ok = await confirm({
      title: "Dar de baja usuario",
      description: `¿Seguro que querés dar de baja a ${usuario.nombreyapellido_user}? El usuario no podrá iniciar sesión.`,
      confirmLabel: "Dar de baja",
      variant: "destructive",
    })
    if (!ok) return

    const resultado = await darDeBaja(usuario.id)
    if (!resultado.success) {
      toast.error(resultado.error ?? "No se pudo dar de baja")
      return
    }
    toast.success("Usuario dado de baja")
    // Recarga la tabla desde el endpoint HTTP.
    await listarUsuarios({
      q: filtros.q,
      estado: filtros.estado,
      desde: filtros.desde || undefined,
      hasta: filtros.hasta || undefined,
      page: filtros.page,
      por: filtros.porPagina,
    })
  }

  async function manejarReactivar(usuario: UsuarioListado) {
    const ok = await confirm({
      title: "Reactivar usuario",
      description: `¿Seguro que querés reactivar a ${usuario.nombreyapellido_user}?`,
      confirmLabel: "Reactivar",
    })
    if (!ok) return

    const resultado = await reactivar(usuario.id)
    if (!resultado.success) {
      toast.error(resultado.error ?? "No se pudo reactivar")
      return
    }
    toast.success("Usuario reactivado")
    await listarUsuarios({
      q: filtros.q,
      estado: filtros.estado,
      desde: filtros.desde || undefined,
      hasta: filtros.hasta || undefined,
      page: filtros.page,
      por: filtros.porPagina,
    })
  }

  const dataLista = data ?? {
    usuarios: [],
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
              <UsersIcon />
              Usuarios
            </CardTitle>
            <CardDescription>
              Administración de cuentas del sistema
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" />}>
                <Columns3Icon />
                Columnas
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {COLUMNAS.map((columna) => (
                    <DropdownMenuCheckboxItem
                      key={columna.id}
                      checked={verColumna(columna.id)}
                      onCheckedChange={() => alternarColumna(columna.id)}
                    >
                      {columna.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={() => setCrearAbierto(true)}>
              <PlusIcon />
              Nuevo usuario
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-52 flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, DNI o email…"
                className="pl-9"
                value={busquedaLocal}
                onChange={(evento) => setBusquedaLocal(evento.target.value)}
              />
            </div>

            <DateInput
              label="Desde"
              value={filtros.desde}
              max={filtros.hasta || undefined}
              onChange={(valor) => navegar({ desde: valor, page: 1 })}
            />
            <DateInput
              label="Hasta"
              value={filtros.hasta}
              min={filtros.desde || undefined}
              onChange={(valor) => navegar({ hasta: valor, page: 1 })}
            />

            <div
              role="group"
              aria-label="Estado del usuario"
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

          <div className="overflow-hidden rounded-2xl border">
            {cargando ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {COLUMNAS.filter((c) => verColumna(c.id)).map((columna) => (
                      <TableHead key={columna.id}>{columna.label}</TableHead>
                    ))}
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataLista.usuarios.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={COLUMNAS.length + 1}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No se encontraron usuarios con los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dataLista.usuarios.map((usuario) => (
                      <TableRow key={usuario.id}>
                        {verColumna("nombreyapellido_user") && (
                          <TableCell className="font-medium">
                            {usuario.nombreyapellido_user}
                          </TableCell>
                        )}
                        {verColumna("dni_user") && (
                          <TableCell>{usuario.dni_user}</TableCell>
                        )}
                        {verColumna("email_user") && (
                          <TableCell>{usuario.email_user}</TableCell>
                        )}
                        {verColumna("role_user") && (
                          <TableCell>
                            <Badge variant="secondary">
                              {usuario.rol?.nombre_rol ?? "—"}
                            </Badge>
                          </TableCell>
                        )}
                        {verColumna("estado_user") && (
                          <TableCell>
                            <Badge
                              variant={
                                usuario.estado_user ? "success" : "muted"
                              }
                            >
                              {usuario.estado_user ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                        )}
                        {verColumna("fechayhora_user") && (
                          <TableCell>
                            {formatearFecha(usuario.fechayhora_user)}
                          </TableCell>
                        )}
                        {verColumna("ultima_conexion_user") && (
                          <TableCell>
                            {formatearFecha(usuario.ultima_conexion_user)}
                          </TableCell>
                        )}
                        {verColumna("usuario_creador") && (
                          <TableCell>{usuario.usuario_creador}</TableCell>
                        )}
                        {verColumna("usuario_modificador") && (
                          <TableCell>{usuario.usuario_modificador ?? "—"}</TableCell>
                        )}
                        {verColumna("fechayhora_modificacion") && (
                          <TableCell>
                            {formatearFecha(usuario.fechayhora_modificacion)}
                          </TableCell>
                        )}

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
                                <DropdownMenuItem onClick={() => setEditar(usuario)}>
                                  <PencilIcon />
                                  Editar
                                </DropdownMenuItem>
                                {usuario.estado_user ? (
                                  <DropdownMenuItem
                                    variant="destructive"
                                    disabled={
                                      accionPendiente === usuario.id ||
                                      usuario.id === usuarioActualId
                                    }
                                    onClick={() => manejarBaja(usuario)}
                                  >
                                    {accionPendiente === usuario.id ? (
                                      <Spinner />
                                    ) : (
                                      <Trash2Icon />
                                    )}
                                    Dar de baja
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    disabled={accionPendiente === usuario.id}
                                    onClick={() => manejarReactivar(usuario)}
                                  >
                                    {accionPendiente === usuario.id ? (
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
                {dataLista.total === 1 ? "usuario" : "usuarios"}
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
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>
              Completá los datos para crear la cuenta de acceso.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70dvh] overflow-y-auto p-4 pt-4 sm:p-6 sm:pt-4">
            <UsuarioForm
              mode="crear"
              roles={roles}
              crearUsuario={crearUsuario}
              actualizarUsuario={actualizarUsuario}
              onSuccess={async () => {
                setCrearAbierto(false)
                toast.success("Usuario creado")
                await listarUsuarios({
                  q: filtros.q,
                  estado: filtros.estado,
                  desde: filtros.desde || undefined,
                  hasta: filtros.hasta || undefined,
                  page: filtros.page,
                  por: filtros.porPagina,
                })
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
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>
              Actualizá los datos personales, el rol o la contraseña.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70dvh] overflow-y-auto p-4 pt-4 sm:p-6 sm:pt-4">
            {editar && (
              <UsuarioForm
                mode="editar"
                usuario={editar}
                roles={roles}
                crearUsuario={crearUsuario}
                actualizarUsuario={actualizarUsuario}
                onSuccess={async () => {
                  setEditar(null)
                  toast.success("Usuario actualizado")
                  await listarUsuarios({
                    q: filtros.q,
                    estado: filtros.estado,
                    desde: filtros.desde || undefined,
                    hasta: filtros.hasta || undefined,
                    page: filtros.page,
                    por: filtros.porPagina,
                  })
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

const inputDateClasses =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 [color-scheme:light] dark:[color-scheme:dark]"

function DateInput({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string
  value: string
  onChange: (valor: string) => void
  min?: string
  max?: string
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      {label}
      <input
        type="date"
        className={inputDateClasses}
        value={value}
        min={min}
        max={max}
        onChange={(evento) => onChange(evento.target.value)}
      />
    </label>
  )
}
