# Arquitectura del proyecto y estructura recomendada

## 1. Visión general

Este proyecto es una **plantilla base para sistemas de gestión** construida con Next.js, Prisma y NextAuth.
Está orientada a servir como fundación reutilizable: cada nuevo sistema de gestión (compras, ventas,
sueldos, u otros dominios) debe crearse a partir de esta plantilla siguiendo los mismos patrones.

**Arquitectura actual (post-migración a REST):**

```
Browser (React Client Components)
  → Hooks (hooks/use*.ts) con React Query → fetch credentials:"include"
    → proxy.ts (protección global: JWT + inactividad + primer_login + headers seguridad)
      → Route Handlers (app/api/*) → auth-guard (requireSession/requireSessionAdmin)
        → Validación Zod → Services (lib/*/service.ts) → Queries (lib/*/queries.ts)
          → Prisma → PostgreSQL
            → Response JSON { ok, data } / { ok:false, error }
              → Hook procesa → Componente renderiza
```

**No hay Server Actions.** Toda mutación y consulta pasa por HTTP REST. La UI nunca accede a Prisma
ni a lógica de negocio directamente.

---

## 2. Stack principal

- Next.js 16.3 App Router — `proxy.ts` (reemplaza a `middleware.ts` deprecado)
- TypeScript 5
- Prisma 7.9 + PostgreSQL
- NextAuth 4.24 (Credentials + JWT strategy)
- React 19 + TanStack React Query 5
- Zod 4 para validación
- bcryptjs para hashing
- Vitest 4 para tests
- Tailwind 4, shadcn/ui, sonner

---

## 3. Estructura de carpetas (estado final)

```
dashboard-plantilla/
├── proxy.ts                              # Protección global (único proxy)
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # NextAuth (no tocar)
│   │   ├── usuarios/
│   │   │   ├── route.ts                  # GET listar + POST crear
│   │   │   └── [id]/
│   │   │       ├── route.ts              # GET detalle + PATCH editar
│   │   │       ├── baja/route.ts         # POST baja lógica
│   │   │       ├── reactivar/route.ts    # POST reactivar
│   │   │       └── solicitar-cambio-password/route.ts
│   │   ├── roles/
│   │   │   ├── route.ts
│   │   │   └── [id]/{route,baja,reactivar}/route.ts
│   │   └── cuenta/
│   │       └── change-password/route.ts  # POST cambio contraseña (requireSession)
│   ├── (panel)/
│   │   ├── layout.tsx                    # Layout, lee sesión solo para UI (esAdmin/email)
│   │   ├── home/                         # Dashboard
│   │   ├── accesos/
│   │   │   ├── usuarios/                 # page.tsx + usuarios-client.tsx + usuario-form.tsx
│   │   │   └── roles/                    # page.tsx + roles-client.tsx + rol-form.tsx
│   │   └── cuenta/
│   │       ├── page.tsx
│   │       ├── change-password-form.tsx  # Usa useCuenta() → REST
│   │       └── cambiar-password/page.tsx
│   └── login/
│       ├── page.tsx
│       └── login-form.tsx                # Muestra ChangePasswordForm si primer_login
├── lib/
│   ├── types/common.ts                   # SessionUser, DominioError, ResultadoAccion (central)
│   ├── validators.ts                     # normalizarOpcional + helpers paginación
│   ├── auth.ts / auth-config.ts / auth-secret.ts
│   ├── auth-guard.ts                     # requireSession() / requireSessionAdmin()
│   ├── api-response.ts                   # ok/created/badRequest/.../manejarError
│   ├── api-auth.ts                       # @deprecated re-exporta auth-guard (compat)
│   ├── prisma.ts
│   ├── utils.ts / mail.ts
│   ├── usuarios/
│   │   ├── service.ts                    # Lógica de negocio (única fuente)
│   │   ├── queries.ts                    # Prisma selects tipados
│   │   ├── schemas.ts                    # Zod strictObject + listarUsuariosQuerySchema
│   │   └── types.ts                      # Re-exporta common + Filtros
│   ├── roles/
│   │   ├── service.ts
│   │   ├── queries.ts
│   │   └── schemas.ts
│   └── cuenta/
│       ├── service.ts                    # changePasswordService
│       └── schemas.ts                    # changePasswordSchema
├── hooks/
│   ├── use-api.ts                        # peticion/procesar/extraerMensaje compartidos
│   ├── useUsuarios.ts                    # Consume /api/usuarios
│   ├── useRoles.ts                       # Consume /api/roles
│   ├── useCuenta.ts                      # Consume /api/cuenta/change-password
│   └── use-confirm.tsx
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── types/next-auth.d.ts
├── config/modules.ts
└── __tests__/
    ├── lib/
    │   ├── utils.test.ts
    │   ├── api-response.test.ts
    │   ├── validators.test.ts
    │   ├── usuarios/schemas.test.ts
    │   └── cuenta/schemas.test.ts
    └── (futuro: api/*.test.ts, proxy.test.ts)
```

---

## 4. Capas y responsabilidades

| Capa | Archivo | Qué hace | Qué NO hace |
|------|---------|----------|-------------|
| **Proxy** | `proxy.ts` | Lee JWT con `getToken()` (sin Prisma), valida inactividad, fuerza `primer_login` a `/login`, verifica `isRouteAllowed`, inyecta headers seguridad | No toca BD, no valida permisos finos |
| **Route Handler** | `app/api/*/route.ts` | Parsea HTTP, llama `requireSession*`, valida Zod, delega a service, traduce `DominioError` a HTTP | No contiene lógica de negocio |
| **Auth Guard** | `lib/auth-guard.ts` | `requireSession()` y `requireSessionAdmin()` usando `getServerSession(authOptions)` | No conoce rutas ni Zod |
| **Service** | `lib/*/service.ts` | Lógica de negocio, reglas de duplicados, hashing, emails, lanza `DominioError` | No importa Next.js ni fetch |
| **Queries** | `lib/*/queries.ts` | Prisma CRUD tipado, joins para trazabilidad | No valida permisos ni schemas |
| **Schemas** | `lib/*/schemas.ts` | Zod `strictObject` para payloads, `z.object` para queries | No toca Prisma |
| **Hook** | `hooks/use*.ts` | Fetch `credentials:"include"` + React Query + `ResultadoAccion` | No toca Prisma ni Zod server |
| **UI** | `app/(panel)/*` | Render + formularios con `zodResolver` | No fetcha directo salvo via hook |

Principio: **el servicio es la única fuente de verdad**. Routes y hooks son adaptadores HTTP.

---

## 5. Autenticación y autorización

### 5.1 Jwt y sesión

- `lib/auth.ts` — `CredentialsProvider` valida `email_user` + `password_user` (bcrypt), verifica `estado_user`, setea `ultima_conexion_user`, retorna `{ id, email, role, esAdmin, primer_login }`.
- `auth-config.ts` — `INACTIVITY_TIMEOUT_SECONDS=40*60`, `SESSION_MAX_AGE_SECONDS=8*60*60`.
- Callbacks `jwt` / `session` propagan `id`, `role`, `esAdmin`, `primer_login`, `lastActivity`. El `jwt` sincroniza `primer_login` desde BD si sigue en `true`.

### 5.2 Proxy (Next.js 16)

> En Next.js 16 `middleware.ts` está deprecado y renombrado a `proxy.ts` con export `proxy(request)`. El tipo es `NextRequest`.

`proxy.ts` usa `getToken({ req, secret })` de `next-auth/jwt` (solo descifra JWT con `jose`, **no toca Prisma**):

1. Rutas públicas: `/login`, `/api/auth/*` → `NextResponse.next()`.
2. Lee JWT. Sin `token.id` → redirect `/login?callbackUrl=...`.
3. Inactividad expirada → borra cookies de sesión + redirect `/login`.
4. `primer_login===true` y `pathname !== "/login"` → redirect `/login` (allí `login-form.tsx` muestra `ChangePasswordForm`).
5. `isRouteAllowed(pathname, esAdmin)` falso → redirect `/home`.
6. En **todas** las respuestas inyecta headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

Matcher: `"/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"` — excluye API y assets.

### 5.3 Route Handlers (defensa en profundidad)

Aunque el proxy ya garantiza sesión, **cada handler revalida**:

- `POST /api/cuenta/change-password` → `requireSession()` (cualquier usuario autenticado, incluso no-admin).
- `GET/POST /api/usuarios/*` y `/api/roles/*` → `requireSessionAdmin()` (solo admin).
- Sin sesión → `401 { ok:false, error:{ code:"NO_AUTORIZADO" } }`.

`lib/auth-guard.ts` es la única fuente; `lib/api-auth.ts` se mantiene solo como re-export deprecated.

### 5.4 Cliente

Todos los fetch usan `credentials:"include"` y `cache:"no-store"`.

---

## 6. Contratos HTTP

### 6.1 Formato respuestas (`lib/api-response.ts`)

```ts
// Éxito
{ ok: true, data: T } // 200
{ ok: true, data: { id } } // 201
// 204 sin body
// Error
{ ok: false, error: { code, message, details? } }
```

Helpers: `ok`, `created`, `noContent`, `badRequest(400)`, `unauthorized(401)`, `forbidden(403)`, `notFound(404)`, `conflict(409)`, `internalError(500)`, `manejarError(error)` traduce `DominioError` → status.

### 6.2 Endpoints

| Método | Ruta | Auth | Descripción | Status |
|--------|------|------|-------------|--------|
| GET | `/api/usuarios?q=&estado=&desde=&hasta=&page=&por=` | ADMIN | Listado paginado (default `activos`, `page=1`, `por=10`) | 200 |
| POST | `/api/usuarios` | ADMIN | Crear usuario (genera password, envía email, `primer_login=true`) | 201/409/400 |
| GET | `/api/usuarios/:id` | ADMIN | Detalle sin password | 200/404 |
| PATCH | `/api/usuarios/:id` | ADMIN | Editar usuario | 200/409/404 |
| POST | `/api/usuarios/:id/baja` | ADMIN | Baja lógica `estado_user=false` | 200/400/404 |
| POST | `/api/usuarios/:id/reactivar` | ADMIN | Reactivar `estado_user=true` | 200/404 |
| POST | `/api/usuarios/:id/solicitar-cambio-password` | ADMIN | Genera nueva temporal, envía email, `primer_login=true` | 200 |
| GET | `/api/roles?q=&estado=&page=&por=` | ADMIN | Listado roles | 200 |
| POST | `/api/roles` | ADMIN | Crear rol | 201/409/400 |
| GET | `/api/roles/:id` | ADMIN | Detalle rol | 200/404 |
| PATCH | `/api/roles/:id` | ADMIN | Editar rol | 200/409/404 |
| POST | `/api/roles/:id/baja` | ADMIN | Baja rol (`estado_rol=false`) | 200/400/404 |
| POST | `/api/roles/:id/reactivar` | ADMIN | Reactivar rol | 200/404 |
| POST | `/api/cuenta/change-password` | SESSION | Cambia contraseña propia, `primer_login=false` | 200/400/401 |

Paginación: `page` y `por` coerceados a número, `por` max 100. Búsqueda `q` por nombre/DNI/email. Fechas `desde/hasta` formato `YYYY-MM-DD`.

### 6.3 Errores de dominio

`lib/types/common.ts: DominioError` con `code`: `VALIDACION→400`, `DUPLICADO_EMAIL/DNI/NOMBRE→409`, `NO_ENCONTRADO→404`, `AUTO_MODIFICACION/ROL_PROTEGIDO→400`, desconocido→500.

---

## 7. Validación con Zod

- **Payloads**: `z.strictObject()` rechaza claves extra → evita que el cliente inyecte `usuario_creador`, etc. `TRACEABILITY_FIELDS` documenta campos prohibidos.
- **Query params**: `z.object()` + `z.coerce.number()` para `page/por`.
- **Opcional**: `z.string().optional().or(z.literal(""))` + `normalizarOpcional()` en el servicio. Ver §10.
- Centralizados en `lib/validators.ts` (`paginacionQuery`, `busquedaQuery`, `filtroEstadoQuery`, `fechaQuery`) y re-exportados en cada `schemas.ts`.

Validación ocurre en route handler (`safeParse` antes de service) y se re-valida en el service (defensa en profundidad). En la UI, `zodResolver(schema)` en react-hook-form.

---

## 8. Flujo por módulo

### 8.1 Usuarios

- `lib/usuarios/queries.ts` — `listarUsuarios({ q, estado, desde, hasta, page, por })` con `where` por `estado_user`, búsqueda `OR contains insensitive`, rango fechas, `skip/take`, y `include` de `rol` + joins creador/modificador (muestra `nombreyapellido_user · email_user`).
- `lib/usuarios/service.ts` — `listarUsuariosService`, `obtenerUsuario`, `crearUsuario` (valida rol activo, duplicados email/DNI, `bcrypt.hash`, `usuario_creador=id` + `usuario_modificador=id`, `primer_login=true`, `enviarEmail`), `actualizarUsuario`, `bajaUsuario/reactivarUsuario` (bloquea auto-modificación).
- `hooks/useUsuarios.ts` — `useQuery(["usuarios", filtros])` + 4 `useMutation` (crear/actualizar/baja/reactivar) con `invalidateQueries(["usuarios"])`. Retorna `{ data, cargando, errorLista, crearUsuario, actualizarUsuario, darDeBaja, reactivar, accionPendiente }`.
- UI: `(panel)/accesos/usuarios/page.tsx` parsea filtros del URL y pasa a `UsuariosClient` (client) que usa el hook; `UsuarioForm` recibe `crearUsuario/actualizarUsuario` como props.

### 8.2 Roles

Análogo a usuarios. `listarRoles`, `crearRol` (verifica nombre único insensitive), `actualizarRol`, `bajaRol` (protege `es_admin`), `reactivarRol`. Hook `useRoles`.

### 8.3 Cuenta

- `lib/cuenta/schemas.ts` — `changePasswordSchema` (`currentPassword` requerido, `newPassword` min 8) `strictObject`.
- `lib/cuenta/service.ts` — `changePasswordService(input, sessionUser)` valida schema, `findUnique`, `bcrypt.compare(current)`, anti-reuso, `update { password, primer_login:false, usuario_modificador }`.
- `app/api/cuenta/change-password/route.ts` — `requireSession()` → `changePasswordService` → `manejarError`.
- `hooks/useCuenta.ts` — `useMutation` hacia `/api/cuenta/change-password`, invalida `["session"]`.
- `change-password-form.tsx` — usa `useCuenta().changePassword({ currentPassword, newPassword })`, antes usaba Server Action.
- `app/(panel)/cuenta/cambiar-password/page.tsx` verifica BD (`primer_login`) y redirige a `/home` si ya no corresponde.

---

## 9. Helpers compartidos

- `lib/types/common.ts` — tipos centrales (`SessionUser`, `ResultadoAccion`, `DominioError`). `lib/usuarios/types.ts` re-exporta para compat; código nuevo importa de `common`.
- `lib/validators.ts` — `normalizarOpcional`, schemas de paginación/búsqueda/estado/fecha.
- `hooks/use-api.ts` — `peticion(url, init)` (fetch con `credentials:"include"`), `procesar<T>(res)` (lanza Error con `error.message`), `extraerMensaje(error)`. Usado por todos los hooks.
- `lib/api-response.ts`, `lib/auth-guard.ts` — ver §5-6.

---

## 10. Regla de persistencia: sin NULLs

Ver también `AGENTS.md`:

- **Nunca se persiste `null` en PostgreSQL.** Opcionales (`direccion_user`, `telefono_user`) se guardan como `""` (`NOT NULL DEFAULT ''` en Prisma). `normalizarOpcional()` hace `trim` y `""` si vacío.
- **Trazabilidad por id, no por email:** `usuario_creador` y `usuario_modificador` almacenan el **id** del usuario de sesión. El email puede cambiar y no debe romper trazabilidad. Al leer, se hace join con `User` para exponer email/nombre (ver `queries.ts`). Al crear, ambos se inicializan con el mismo `id` para no dejar NULL.
- **Excepción única y deliberada:** `ultima_conexion_user` puede ser `null` ("nunca se conectó"), UI muestra "—".
- Aplicar la misma regla a módulos nuevos (roles, compras, ventas, sueldos). En `schema.prisma` todo opcional es `String @default("")` salvo `ultima_conexion_user DateTime?`.

---

## 11. Migración completada (histórico)

Migración Server Actions → REST (rama `migracion-apis`) en 6 fases:

0. **Tipos/validators centralizados** — `lib/types/common.ts`, `lib/validators.ts`, re-exports en `lib/usuarios/types.ts` y `lib/usuarios/schemas.ts`.
1. **Proxy** — creado `proxy.ts` con `getToken()`, expiración, `primer_login`, `isRouteAllowed`, headers seguridad. Matcher excluye API/assets.
2. **Cuenta** — `lib/cuenta/*`, `app/api/cuenta/change-password`, `hooks/useCuenta` + `hooks/use-api`, `change-password-form` migrado, server action eliminada.
3. **Hooks genéricos** — extraídos `peticion/procesar/extraerMensaje` a `hooks/use-api.ts`, `useUsuarios`/`useRoles` refactorizados, import de `ResultadoAccion` desde `common`.
4. **Auth guard** — `lib/auth-guard.ts` con `requireSession`+`requireSessionAdmin`; `lib/api-auth.ts` quedó deprecated re-export; todos los route handlers migrados a `@/lib/auth-guard`.
5. **Eliminar Server Actions** — borrados `lib/usuarios/actions.ts` y `app/(panel)/cuenta/actions.ts`. `grep "use server"` limpio.
6. **Tests + docs** — `__tests__/lib/cuenta/schemas.test.ts`, `__tests__/lib/validators.test.ts`; doc arquitectura actualizada (este archivo).

Chain final verificada: `Componente → hook → fetch → proxy → route handler → auth-guard → Zod → service → queries → Prisma → response → hook → UI`. Sin duplicación de lógica.

---

## 12. Como usar esta plantilla como base de otro sistema

1. **Clonar y renombrar** el proyecto. Mantener `proxy.ts`, `lib/auth*`, `lib/types/common.ts`, `lib/validators.ts`, `lib/api-response.ts`, `hooks/use-api.ts` sin cambios.
2. **Agregar un dominio** (ej. `compras`):
   - `prisma/schema.prisma` → nuevo `model Compra` con campos `estado_compra Boolean @default(true)`, `usuario_creador String`, `usuario_modificador String`, `fechayhora_compra DateTime @default(now())`, opcionales como `String @default("")`, y `ultima_conexion` solo si aplica.
   - `lib/compras/schemas.ts` — `crearCompraSchema = z.strictObject({...})`, `listarComprasQuerySchema = z.object({ q: busquedaQuery, estado: filtroEstadoQuery, ...paginacionQuery })`.
   - `lib/compras/queries.ts` — `listarCompras`, `obtenerCompra` con `select` explícito y joins de trazabilidad.
   - `lib/compras/service.ts` — funciones con `(input, sessionUser: SessionUser)` y `throw new DominioError(...)`, usando `normalizarOpcional`.
   - `app/api/compras/route.ts` y `[id]/*` — `requireSession*` → `safeParse` → `service` → `manejarError`.
   - `hooks/useCompras.ts` — patrón idéntico a `useUsuarios` usando `peticion/procesar` de `hooks/use-api`.
   - UI en `app/(panel)/compras/` — `page.tsx` (server, parsea filtros) + `compras-client.tsx` (client, usa hook) + `compra-form.tsx`.
   - Tests en `__tests__/lib/compras/schemas.test.ts` y `__tests__/api/compras.test.ts` (mockear `getServerSession` y Prisma).
3. **Registrar el módulo** en `config/modules.ts` (`MODULES`, `isRouteAllowed`, sidebar) y en la sidebar/header.
4. **Respetar convenciones**: endpoints REST (`GET /api/recurso`, `POST /api/recurso`, `GET/PATCH /api/recurso/:id`, `POST /:id/baja`, `POST /:id/reactivar`), respuestas `{ ok, data }` / `{ ok:false, error }`, `strictObject`, sin NULLs, trazabilidad por id.
5. **No reintroducir Server Actions.** Toda acción pasa por `fetch → route handler → service`. Verificar con `grep -r "use server" --include="*.ts" --include="*.tsx" app lib hooks`.
6. **Actualizar este documento** al agregar el módulo (estructura, endpoints, decisiones).

---

## 13. Convenciones y checklist para código nuevo

- [ ] Schema `z.strictObject` + `safeParse` en handler y service.
- [ ] Opcional → `normalizarOpcional()` → `""` nunca `null`.
- [ ] Trazabilidad `usuario_creador/modificador = sessionUser.id` (no email).
- [ ] Handler usa `requireSession` o `requireSessionAdmin` y `credentials:"include"` en el hook.
- [ ] Service lanza `DominioError` tipado; handler usa `manejarError`.
- [ ] Respuesta `ok/created/badRequest/...` con `{ ok, data }`.
- [ ] Hook usa `peticion/procesar/extraerMensaje` de `hooks/use-api` y `ResultadoAccion` de `lib/types/common`.
- [ ] `proxy.ts` no necesita cambios salvo nuevo módulo en `config/modules.ts`.
- [ ] `npx tsc --noEmit` y `pnpm test` pasan; `grep "use server"` limpio.

---

## 14. Instrucción para un modelo integrador

Quien reciba este documento debe entender que:

- La app es Next.js App Router con **REST puro** (sin Server Actions).
- `proxy.ts` (no `middleware.ts`) es la protección global con `getToken()` y headers seguridad.
- `lib/auth-guard.ts` protege cada endpoint; `lib/types/common.ts` y `lib/validators.ts` son los tipos/helpers centrales.
- Prisma es la persistencia; la lógica vive en `lib/*/service.ts` y nunca se duplica.
- La UI consume solo `hooks/use*.ts` que hacen `fetch` a `app/api/*`.
- Este repo es **plantilla base**: nuevos sistemas de gestión replican el patrón de usuarios/roles/cuenta.
- Regla sin NULLs y trazabilidad por id son obligatorias en todo módulo nuevo.

---

## 15. Conclusión

La plantilla migró completamente a arquitectura REST por capas, con seguridad en dos niveles (proxy + handler), contratos HTTP estables, validación Zod en ambos lados y servicios centralizados reutilizables. Es valida como dashboard interno y lista para exponer API o para servir de base a múltiples sistemas de gestión sin reescribir lógica ni reintroducir Server Actions.
