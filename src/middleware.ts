import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ADMIN_PATHS = ['/posts']

export async function middleware(req: NextRequest) {
  const url = new URL(req.url)
  const isAdminRoute = ADMIN_PATHS.some((p) => url.pathname.startsWith(p))
  if (!isAdminRoute) return NextResponse.next()

  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map((c) => ({ name: c.name, value: c.value }))
        },
        setAll(cookies) {
          for (const { name, value, options } of cookies) {
            res.cookies.set(name, value, options)
          }
        }
      }
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', session.user.id)
    .maybeSingle()

  if (!adminRow) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/posts/:path*',
  ]
}


