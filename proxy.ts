import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/cadastro', '/recuperar-senha', '/redefinir-senha']

const API_URL = process.env.NEXT_PUBLIC_API_URL!

async function isTokenValid(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    return res.ok
  } catch {
    return false
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('karis_token')?.value

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (!isPublic && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isPublic && token) {
    const valid = await isTokenValid(token)
    if (valid) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    const res = NextResponse.next()
    res.cookies.set('karis_token', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 })
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|designer|file.svg|globe.svg|next.svg|vercel.svg|window.svg).*)'],
}
