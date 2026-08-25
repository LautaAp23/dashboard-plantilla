import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { INACTIVITY_TIMEOUT_SECONDS } from "@/lib/auth"
import { getAuthSecret } from "@/lib/auth-secret"

const PUBLIC_ROUTES = ["/login"]

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
    return res
  }

  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (token && (isPublicRoute || pathname === "/")) {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
