import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth — salva token em cookie httpOnly após login
export async function POST(req: NextRequest) {
  const { token } = await req.json()

  const res = NextResponse.json({ ok: true })
  res.cookies.set('karis_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  })
  return res
}

// DELETE /api/auth — limpa cookie no logout
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('karis_token')
  return res
}
