import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { isRouteAllowed } from "@/config/modules"
import {
  INACTIVITY_TIMEOUT_SECONDS,
} from "@/lib/auth-config"
import { getAuthSecret } from "@/lib/auth-secret"

const PUBLIC_ROUTES = ["/login"]

function agregarSeguridad(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  )
  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  const token = await getToken({
    req: request,
    secret: getAuthSecret(),
  })

  const lastActivity = token?.lastActivity as number | undefined
  const isExpired =
    !!token && (!lastActivity || Date.now() - lastActivity > INACTIVITY_TIMEOUT_SECONDS * 1000)

  if (isExpired) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    const res = NextResponse.redirect(loginUrl)
    res.cookies.delete("next-auth.session-token")
    res.cookies.delete("__Secure-next-auth.session-token")
    return agregarSeguridad(res)
  }

  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return agregarSeguridad(NextResponse.redirect(loginUrl))
  }

  // Cambio de contraseña obligatorio (primer inicio de sesión o solicitud de
  // cambio): se fuerza a la pantalla de login, donde se pide establecer una
  // nueva contraseña antes de poder acceder al panel. Esto evita que el
  // usuario pueda saltarse el paso navegando por el dashboard.
  const primerLogin = Boolean(token?.primer_login)
  if (token && primerLogin) {
    if (pathname !== "/login") {
      return agregarSeguridad(NextResponse.redirect(new URL("/login", request.url)))
    }
    return agregarSeguridad(NextResponse.next())
  }

  if (token && (isPublicRoute || pathname === "/")) {
    return agregarSeguridad(NextResponse.redirect(new URL("/home", request.url)))
  }

  if (token && !isRouteAllowed(pathname, token.esAdmin ?? false)) {
    return agregarSeguridad(NextResponse.redirect(new URL("/home", request.url)))
  }

  return agregarSeguridad(NextResponse.next())
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
