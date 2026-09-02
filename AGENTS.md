<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Regla de persistencia: sin NULLs

- **Nunca** persistir `null` en postgresql. Los campos opcionales de entrada se
  guardan como string vacío (`""`), no como `null` (ver `normalizarOpcional` en
  `lib/usuarios/schemas.ts`).
- Los campos de trazabilidad (`usuario_creador`, `usuario_modificador`) siempre
  almacenan el **id** del usuario de sesión que ejecutó la acción, nunca su
  email ni su nombre (el email puede cambiar y rompería la trazabilidad). El
  email/nombre se resuelven por join al momento de leer.
- Excepción única y deliberada: `ultima_conexion_user` puede ser `null` porque
  representa "el usuario nunca se conectó". Su ausencia se muestra en la UI
  como "—".
- Aplicar esta regla también a módulos nuevos (roles, compras, ventas, sueldos).
