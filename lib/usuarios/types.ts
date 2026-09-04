import type {
  CrearUsuarioInput,
  ActualizarUsuarioInput,
} from "@/lib/usuarios/schemas"
import type { ListarUsuariosResult } from "@/lib/usuarios/queries"

// Re-exporta tipos centralizados (lib/types/common.ts) para compatibilidad.
// Nuevos módulos deben importar directamente desde "@/lib/types/common".
export type {
  SessionUser,
  ResultadoAccion,
  DominioErrorCode,
} from "@/lib/types/common"
export { DominioError } from "@/lib/types/common"

/** Filtros del listado tal como llegan por query string del endpoint HTTP. */
export type ListarUsuariosFiltros = {
  q?: string
  estado?: "activos" | "inactivos" | "todos"
  desde?: string // YYYY-MM-DD
  hasta?: string // YYYY-MM-DD
  page?: number
  por?: number
}

export type { CrearUsuarioInput, ActualizarUsuarioInput, ListarUsuariosResult }
