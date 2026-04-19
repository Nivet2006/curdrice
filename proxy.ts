import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { v4 as uuidv4 } from 'uuid'

// DO NOT import logsClient here — middleware runs on edge if configured, use fetch instead
async function logNavigation(payload: {
  session_id: string
  user_id?: string
  user_email?: string
  user_name?: string
  user_role?: string
  ip_address: string
  user_agent: string
  resource_path: string
}) {
  try {
    await fetch(`${process.env.LOGS_SUPABASE_URL}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.LOGS_SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${process.env.LOGS_SUPABASE_SERVICE_KEY!}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        session_id: payload.session_id,
        user_id: payload.user_id || null,
        user_email: payload.user_email || null,
        user_name: payload.user_name || null,
        user_role: payload.user_role || null,
        ip_address: payload.ip_address,
        user_agent: payload.user_agent,
        action_type: 'NAVIGATION',
        resource_path: payload.resource_path,
        metadata: {},
        created_at: new Date().toISOString(),
      }),
    })
  } catch (e) {
    console.error('[MIDDLEWARE LOG FAIL]', e)
  }
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip static/internal routes
  const path = request.nextUrl.pathname
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/health') ||
    path === '/favicon.ico' ||
    path.match(/\.(png|jpg|svg|ico|webp|css|js)$/)
  ) {
    return supabaseResponse
  }

  // Get or create session_id cookie
  let sessionId = request.cookies.get('cr_session_id')?.value
  if (!sessionId) {
    sessionId = uuidv4()
    supabaseResponse.cookies.set('cr_session_id', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null
  let userProfile = null
  try {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      if (
        error.message?.includes('Refresh Token Not Found') ||
        error.message?.includes('refresh_token_not_found') ||
        error.message?.includes('Invalid Refresh Token')
      ) {
        await supabase.auth.signOut()
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        return NextResponse.redirect(loginUrl)
      }
    }

    user = data?.user || null
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('role, full_name, totp_enabled').eq('id', user.id).single()
        userProfile = profile
    }
  } catch (error: any) {
    user = null
  }

  const role = userProfile?.role || 'student'
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register')

  // Redirect unauthenticated users to login
  if (!user && !isAuthPage && request.nextUrl.pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Handle authenticated users
  if (user) {
      if (role === 'deleted') {
          await supabase.auth.signOut()
          const url = request.nextUrl.clone()
          url.pathname = '/login'
          url.searchParams.set('error', 'account_suspended')
          return NextResponse.redirect(url)
      }

      if (isAuthPage) {
          const url = request.nextUrl.clone()
          url.pathname = `/${role}/dashboard`
          return NextResponse.redirect(url)
      }

      // TOTP Check for Admins
      if (path.startsWith('/admin') && role === 'admin' && userProfile?.totp_enabled) {
          const totpVerified = request.cookies.get('curdrice_totp_verified')?.value === 'true'
          if (!totpVerified && path !== '/auth/totp-verify') {
              const url = request.nextUrl.clone()
              url.pathname = '/auth/totp-verify'
              url.searchParams.set('redirect', path)
              return NextResponse.redirect(url)
          }
      }

      // RBAC
      if (path.startsWith('/admin') && role !== 'admin') {
          const url = request.nextUrl.clone()
          url.pathname = `/${role}/dashboard`
          return NextResponse.redirect(url)
      }
      if (path.startsWith('/manager') && !['manager', 'admin'].includes(role)) {
          const url = request.nextUrl.clone()
          url.pathname = `/${role}/dashboard`
          return NextResponse.redirect(url)
      }
      if (path.startsWith('/cc') && !['cc', 'admin'].includes(role)) {
          const url = request.nextUrl.clone()
          url.pathname = `/${role}/dashboard`
          return NextResponse.redirect(url)
      }
      if (path.startsWith('/pr') && !['pr', 'admin'].includes(role)) {
          const url = request.nextUrl.clone()
          url.pathname = `/${role}/dashboard`
          return NextResponse.redirect(url)
      }
      if (path.startsWith('/teacher') && !['teacher', 'admin'].includes(role)) {
          const url = request.nextUrl.clone()
          url.pathname = `/${role}/dashboard`
          return NextResponse.redirect(url)
      }
      if (path.startsWith('/hod') && !['hod', 'admin'].includes(role)) {
          const url = request.nextUrl.clone()
          url.pathname = `/${role}/dashboard`
          return NextResponse.redirect(url)
      }
  }

  // Log Navigation
  const ip =
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '0.0.0.0'

  void logNavigation({
    session_id: sessionId!,
    user_id: user?.id,
    user_email: user?.email,
    user_name: userProfile?.full_name,
    user_role: role,
    ip_address: ip,
    user_agent: request.headers.get('user-agent') || 'unknown',
    resource_path: path,
  })

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
