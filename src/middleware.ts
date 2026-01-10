import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

const publicRoutes = [
  '/',
  '/login',
  '/signup',
]

const publicApiRoutes = [
  '/api/auth',
  '/api/health',
]

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isPublicRoute = publicRoutes.includes(nextUrl.pathname)
  const isPublicApiRoute = publicApiRoutes.some(route => 
    nextUrl.pathname.startsWith(route)
  )
  const isApiRoute = nextUrl.pathname.startsWith('/api')

  if (isPublicApiRoute) {
    return NextResponse.next()
  }

  if (isApiRoute && !isLoggedIn) {
    return NextResponse.json(
      { success: false, error: 'Não autorizado' },
      { status: 401 }
    )
  }

  if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL('/login', nextUrl)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}