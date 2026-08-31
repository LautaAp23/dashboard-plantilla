# Arquitectura del proyecto y estructura recomendada

## 1. Visión general

Este proyecto es una aplicación web construida con Next.js, Prisma y NextAuth, orientada a un dashboard administrativo interno.

La arquitectura actual mezcla:

- frontend en App Router de Next.js
- lógica de acceso a datos con Prisma
- autenticación con NextAuth
- manejo de operaciones CRUD a través de server actions
- UI en componentes React y formularios del lado del cliente

La estructura del proyecto está pensada principalmente para uso interno del sistema, no para exponer una API pública o compartir backend con otros sistemas externos.

---

## 2. Stack principal

- Next.js App Router
- TypeScript
- Prisma ORM
- PostgreSQL / base relacional configurada en Prisma
- NextAuth para autenticación y sesiones
- React + componentes reutilizables
- Zod para validación de inputs
- bcryptjs para hashing de contraseñas

---

## 3. Cómo está organizado el proyecto hoy

### Estructura principal

- app/: páginas, layouts, rutas de la app y routes API
- components/: componentes UI reutilizables
- lib/: lógica compartida del backend y utilidades
- prisma/: schema y migraciones
- public/: assets públicos
- types/: tipos globales

### Módulo de usuarios

El módulo de usuarios es la referencia más clara para entender la arquitectura actual.

#### Archivos relevantes

- app/(panel)/usuarios/page.tsx
  - página del panel que valida filtros y carga usuarios
  - verifica sesión del usuario
  - comprueba permisos de administrador
  - llama a `listarUsuarios()`

- app/(panel)/usuarios/usuarios-client.tsx
  - UI cliente para listar, buscar, filtrar, paginar y abrir modales
  - dispara acciones de baja/reactivación y abre formularios

- app/(panel)/usuarios/usuario-form.tsx
  - formulario de creación/edición de usuarios
  - invoca `crearUsuario()` y `actualizarUsuario()`

- lib/usuarios/queries.ts
  - funciones de consulta a Prisma
  - lista de usuarios, filtros, búsqueda y paginación

- lib/usuarios/actions.ts
  - lógica de creación, actualización, baja lógica y reactivación
  - usa Prisma directamente
  - valida roles y usuarios autenticados
  - encripta contraseñas con bcrypt

- lib/usuarios/schemas.ts
  - validaciones con Zod para inputs de creación y actualización

---

## 4. Flujo actual del módulo de usuarios

### 4.1 Listado

En [app/(panel)/usuarios/page.tsx](app/(panel)/usuarios/page.tsx):

1. obtiene la sesión actual
2. valida que el usuario sea ADMIN
3. parsea query params
4. llama a `listarUsuarios(...)`
5. pasa resultado al client para renderizar la tabla

La lógica de listado se hace con Prisma en [lib/usuarios/queries.ts](lib/usuarios/queries.ts).

### 4.2 Crear usuario

En [app/(panel)/usuarios/usuario-form.tsx](app/(panel)/usuarios/usuario-form.tsx):

- el formulario hace submit del lado del cliente
- llama a `crearUsuario(values)`

En [lib/usuarios/actions.ts](lib/usuarios/actions.ts):

- valida sesión admin
- valida schema con Zod
- chequea email / DNI duplicados
- hashea la contraseña con bcrypt
- crea el usuario en Prisma

### 4.3 Editar usuario

- usuario abre modal de edición
- formulario envía `actualizarUsuario(userId, values)`
- la acción valida duplicados y actualiza campos permitidos
- si se envía nueva contraseña, la hashea antes del update

### 4.4 Baja / reactivación

La lógica de baja no borra el registro físicamente. Se hace baja lógica usando `estado_user = false`.

Esto está pensado para conservar trazabilidad y no perder el historial del usuario.

---

## 5. Patrón actual de arquitectura

La aplicación actualmente usa un patrón de server-side app logic, no REST API.

### Qué significa esto

No hay endpoints HTTP como:

- GET /api/usuarios
- POST /api/usuarios
- PUT /api/usuarios/:id
- DELETE /api/usuarios/:id

El flujo principal es:

- página server component valida sesión
- consulta datos con Prisma o server actions
- UI cliente invoca funciones del servidor
- funciones del servidor ejecutan Prisma directamente

Este patrón es típico y válido para aplicaciones internas y dashboards.

---

## 6. Cómo funciona la autenticación

La autenticación está en [lib/auth.ts](lib/auth.ts).

Incluye:

- proveedor CredentialsProvider
- validación de email y contraseña
- comparación con bcrypt
- acceso a Prisma para buscar al usuario
- retorno de sesión con id, email y role

También se controla:

- `estado_user` del usuario
- sesión JWT
- expiración/inactividad
- role del usuario para permisos

La ruta de NextAuth está en:

- app/api/auth/[...nextauth]/route.ts

Esto confirma que la app usa un stack de autenticación integrado con Next.js y Prisma, no un backend separado.

---

## 7. Estructura de dominio / módulo

La organización del dominio está orientada por feature modules, principalmente:

- usuarios
- auth
- layout
- UI general

Esto es una buena base para seguir creciendo con más módulos como:

- compras
- ventas
- sueldos
- cuenta
- home

Cada módulo puede mantener:

- page.tsx
- client component
- queries.ts
- actions.ts
- schemas.ts

Esto facilita la organización para un gestor administrativo.

---

## 8. Qué está bien en la arquitectura actual

La solución actual tiene varias ventajas:

- simple para un dashboard interno
- menos boilerplate que una API REST tradicional
- acceso directo a Prisma sin capa extra
- buen desacople entre UI y acceso a datos
- permisos aplicados en el servidor
- validación centralizada con Zod

Esto es apropiado para una aplicación empresarial interna de administración.

---

## 9. Limitaciones de esta arquitectura para integración futura

Si el sistema necesita integrarse con otros sistemas, la arquitectura actual presenta estas limitaciones:

1. No existe una API estándar para terceros
2. Las acciones del servidor no son fácilmente consumidas por clientes externos
3. No hay contratos HTTP claros ni documentación de endpoints
4. Integraciones externas requieren un adaptador extra o duplicación de lógica
5. El backend no es reutilizable como servicio independiente

Esto no significa que esté mal, simplemente significa que está pensado para un entorno cerrado y autocontenible.

---

## 10. Recomendación de arquitectura para crecimiento futuro

Si a futuro se espera integrar con otros sistemas, recomiendo mantener el mismo stack base, pero agregar una capa HTTP de backend con API routes.

La idea más sana es:

- dejar Prisma como la capa de persistencia
- crear servicios de dominio en `lib/`
- reutilizar esos servicios tanto desde server actions como desde API routes
- mantener la UI como frontend en App Router

### Estructura recomendada

```text
app/
  api/
    usuarios/
      route.ts
    usuarios/[id]/
      route.ts
  (panel)/
    usuarios/
      page.tsx
      usuarios-client.tsx
      usuario-form.tsx
components/
lib/
  auth.ts
  auth-config.ts
  prisma.ts
  usuarios/
    service.ts
    queries.ts
    actions.ts
    schemas.ts
prisma/
  schema.prisma
  migrations/
```

### Principio de diseño

Los servicios de negocio deben vivir en `lib/usuarios/service.ts` y no duplicarse en cada capa.

Por ejemplo:

- `listarUsuariosService()`
- `crearUsuarioService()`
- `actualizarUsuarioService()`
- `bajaUsuarioService()`

Luego:

- `lib/usuarios/actions.ts` usa esos servicios para server actions
- `app/api/usuarios/route.ts` usa esos servicios para endpoints HTTP

Esto evita duplicación y hace posible crecer sin romper la app.

---

## 11. Decisión recomendada para este proyecto

### Mantener la arquitectura actual si:

- el producto es un dashboard interno
- no hay integración con otros sistemas
- la prioridad es velocidad de desarrollo y simplicidad

### Migrar a API routes si:

- hay intención de integrar con apps externas
- se necesita comunicación desde otras interfaces
- se quieren contratos HTTP estables
- se prevé crecimiento del backend o separación de capas

### Recomendación práctica

Para este proyecto, la mejor estrategia no es “todo o nada”.

La mejor opción es:

1. mantener el panel actual con server actions y Prisma
2. centralizar la lógica en servicios
3. preparar API routes para futura integracion
4. documentar los endpoints cuando el proyecto lo necesite

Es decir, evolucionar sin reescribir el sistema completo.

---

## 12. Resumen ejecutivo

Este proyecto hoy está implementado como una app administrativa con Next.js + Prisma + NextAuth usando server actions como capa principal de negocio.

La funcionalidad de ABM de usuarios ya existe y está bien integrada con el panel, pero no está expuesta como REST API.

Eso es correcto si el objetivo es un dashboard interno. Sin embargo, si el sistema quiere integrarse con otros sistemas en el futuro, conviene construir una capa HTTP de API routes sobre la misma lógica de negocio.

---

## 13. Instrucción para un modelo integrador

El modelo que reciba este documento debe entender que:

- la app está construida sobre Next.js App Router
- la autenticación y permisos se manejan con NextAuth y session JWT
- Prisma es la capa de persistencia
- el ABM de usuarios ya está implementado en server actions
- la lógica de negocio está en `lib/usuarios/*`
- existe una forma de evolucionar hacia API routes sin romper la estructura actual
- la clave es centralizar la lógica y no duplicarla entre backend y frontend

---

## 14. Conclusión

La arquitectura actual es válida y funcional para un sistema interno. No es un “error”, sino una decisión de diseño.

La recomendación para un proyecto con perspectiva de integración es preparar la base para API REST sin abandonar el actual flujo del dashboard.

Esto se logra con modularización, servicios centralizados y una transición gradual hacia rutas HTTP cuando el proyecto lo requiera.

---

## 15. Migración a capas + endpoints HTTP (módulo de usuarios)

Se adoptó la arquitectura por capas recomendada en la sección 10 para el módulo de usuarios:

```
Componente React → hooks → Route Handler (/api/usuarios) → Servicio (lib/usuarios/service.ts) → queries/Prisma → PostgreSQL
```

### Reglas aplicadas

- La UI no accede a Prisma ni a la lógica de negocio. Solo consume endpoints HTTP.
- La validación de sesión y permisos (ADMIN) ocurre en cada route handler (`lib/api-auth.ts`).
- La lógica de negocio se centraliza en `lib/usuarios/service.ts`, reutilizable desde
  API routes y desde las server actions de compatibilidad. Sin duplicación.
- Los hooks (`hooks/useUsuarios.ts`) solo hacen fetch a `/api/usuarios`.

### Estructura nueva / modificada

- `lib/api-response.ts` — respuestas JSON estándar `{ ok, data }` / `{ ok, error }` y mapeo de errores de dominio a HTTP.
- `lib/api-auth.ts` — helper `requireSessionAdmin()` (NextAuth + rol ADMIN → 401/403).
- `lib/usuarios/types.ts` — contrato HTTP compartido (`SessionUser`, `DominioError`, `ResultadoAccion`, filtros).
- `lib/usuarios/service.ts` — lógica de negocio central (listar, obtener, crear, actualizar, baja/reactivar).
- `lib/usuarios/queries.ts` — acceso a datos (se conserva; el servicio delega en él).
- `lib/usuarios/schemas.ts` — schemas Zod reutilizados (se agregó `listarUsuariosQuerySchema`).
- `app/api/usuarios/route.ts` — GET (listado con filtros) + POST (crear).
- `app/api/usuarios/[id]/route.ts` — GET (detalle) + PATCH (editar).
- `app/api/usuarios/[id]/baja/route.ts` y `app/api/usuarios/[id]/reactivar/route.ts` — POST.
- `hooks/useUsuarios.ts` — hook cliente que consume los endpoints.
- `lib/usuarios/actions.ts` — quedó como capa de compatibilidad que delega en el servicio (NO duplica lógica).

### Endpoints

| Método | Ruta | Descripción | Status |
| --- | --- | --- | --- |
| GET | `/api/usuarios?q=&estado=&desde=&hasta=&page=&por=` | Listado paginado con filtros (default activos) | 200 |
| POST | `/api/usuarios` | Crear usuario | 201 / 409 / 400 |
| GET | `/api/usuarios/:id` | Detalle (sin password) | 200 / 404 |
| PATCH | `/api/usuarios/:id` | Editar usuario | 200 / 409 / 404 |
| POST | `/api/usuarios/:id/baja` | Baja lógica (`estado_user=false`) | 200 / 400 / 404 |
| POST | `/api/usuarios/:id/reactivar` | Reactivación (`estado_user=true`) | 200 / 400 / 404 |

Auth en todos los endpoints: sin sesión → 401; sin rol ADMIN → 403.
Errores: 400 (Zod/auto-modificación), 404 (P2025 / inexistente), 409 (email/DNI duplicado), 500 (desconocido).

### Decisiones documentadas

- **Ubicación de hooks:** el proyecto no tenía `src/` en raíz; se creó `hooks/` en la raíz,
  consistente con el `hooks/use-confirm.tsx` existente. Se documenta aquí y en los comentarios del hook.
- **Protección de la página `(panel)/usuarios/page.tsx`:** quedó como contenedor server que valida
  sesión/rol y pasa los filtros al client. La fuente de datos de la tabla ya no sale de la página:
  `UsuariosClient` la carga vía hook → `GET /api/usuarios`. Además cada route handler aplica su propia
  validación (401/403), por lo que la protección de datos está en los endpoints.
- **Compatibilidad:** las server actions (`lib/usuarios/actions.ts`) se conservan delegando en el
  servicio. La cadena principal de la UI es hooks → API → servicio → Prisma.

