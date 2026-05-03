import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'karis_token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

/** POST /api/auth — called after login to persist token in httpOnly cookie */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      secure: process.env.NODE_ENV === 'production',
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/** DELETE /api/auth — called on logout to clear cookie */
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
