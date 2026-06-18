import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { verifyTotpChallenge } from '@/lib/totp-challenge'

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
    if (!process.env.LOGS_SUPABASE_URL || !process.env.LOGS_SUPABASE_SERVICE_KEY) {
      return
    }
    await fetch(`${process.env.LOGS_SUPABASE_URL}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.LOGS_SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.LOGS_SUPABASE_SERVICE_KEY}`,
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
  const nonce = crypto.randomUUID()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', buildCSP(nonce))

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Skip static/internal routes
  const path = request.nextUrl.pathname
  const isApiRoute = path.startsWith('/api/')
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/health') ||
    path === '/favicon.ico' ||
    path.match(/\.(png|jpg|svg|ico|webp|css|js)$/)
  ) {
    return supabaseResponse
  }

  // Get or create session_id cookie using native crypto.randomUUID()
  let sessionId = request.cookies.get('cr_session_id')?.value
  if (!sessionId) {
    sessionId = crypto.randomUUID()
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              httpOnly: name.startsWith('sb-') ? false : options?.httpOnly,
            })
          )
        },
      },
    }
  )

  let user = null
  let userProfile = null
  try {
    // CRITICAL: getUser() is called on every matched request to refresh session
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      if (
        error.message?.includes('Refresh Token Not Found') ||
        error.message?.includes('refresh_token_not_found') ||
        error.message?.includes('Invalid Refresh Token')
      ) {
        await supabase.auth.signOut()
        supabaseResponse.cookies.delete('curdrice_user_role')
        supabaseResponse.cookies.delete('curdrice_user_name')
        supabaseResponse.cookies.delete('curdrice_user_totp')
        supabaseResponse.cookies.delete('curdrice_totp_verified')
        if (isApiRoute) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        return NextResponse.redirect(loginUrl)
      }
      console.error('[Middleware] Auth error:', error.message)
    }

    user = data?.user || null
    if (user) {
      // ⚡ Try to get profile from cookies first to avoid database queries on every route
      const cachedRole = request.cookies.get('curdrice_user_role')?.value
      const cachedName = request.cookies.get('curdrice_user_name')?.value
      const cachedTotp = request.cookies.get('curdrice_user_totp')?.value

      if (cachedRole && cachedName) {
        userProfile = {
          role: cachedRole,
          full_name: cachedName,
          totp_enabled: cachedTotp === 'true'
        }
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, totp_enabled')
          .eq('id', user.id)
          .single()
        
        userProfile = profile
        if (profile) {
          supabaseResponse.cookies.set('curdrice_user_role', profile.role, {
            path: '/',
            maxAge: 3600 * 24, // 1 day
            sameSite: 'lax',
          })
          supabaseResponse.cookies.set('curdrice_user_name', profile.full_name, {
            path: '/',
            maxAge: 3600 * 24, // 1 day
            sameSite: 'lax',
          })
          supabaseResponse.cookies.set('curdrice_user_totp', String(!!profile.totp_enabled), {
            path: '/',
            maxAge: 3600 * 24, // 1 day
            sameSite: 'lax',
          })
        }
      }
    }
  } catch (error: any) {
    user = null
  }

  const role = userProfile?.role || 'student'
  const isAuthPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register')

  const isPublicEventPage = request.nextUrl.pathname.startsWith('/events/')
  const isRedirectPage = request.nextUrl.pathname.startsWith('/redirect/')

  // Redirect unauthenticated users to login, but bypass public event details and redirect pages
  if (
    !user &&
    !isAuthPage &&
    request.nextUrl.pathname !== '/' &&
    !isPublicEventPage &&
    !isRedirectPage
  ) {
    supabaseResponse.cookies.delete('curdrice_user_role')
    supabaseResponse.cookies.delete('curdrice_user_name')
    supabaseResponse.cookies.delete('curdrice_user_totp')
    supabaseResponse.cookies.delete('curdrice_totp_verified')
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Handle authenticated users
  if (user) {
    if (role === 'deleted') {
      await supabase.auth.signOut()
      supabaseResponse.cookies.delete('curdrice_user_role')
      supabaseResponse.cookies.delete('curdrice_user_name')
      supabaseResponse.cookies.delete('curdrice_user_totp')
      supabaseResponse.cookies.delete('curdrice_totp_verified')
      if (isApiRoute) {
        return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
      }
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

    // TOTP Check for Admins: verify the signed HMAC challenge token
    if (path.startsWith('/admin') && role === 'admin' && userProfile?.totp_enabled) {
      const totpVerifiedToken = request.cookies.get('curdrice_totp_verified')?.value
      const verifiedUserId = totpVerifiedToken ? await verifyTotpChallenge(totpVerifiedToken) : null
      
      if (verifiedUserId !== user.id && path !== '/auth/totp-verify') {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/totp-verify'
        url.searchParams.set('redirect', path)
        return NextResponse.redirect(url)
      }
    }

    // RBAC rules
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

  // Apply security headers
  applySecurityHeaders(supabaseResponse, nonce)

  return supabaseResponse
}

function applySecurityHeaders(response: NextResponse, nonce: string) {
  response.headers.set('x-nonce', nonce)

  response.headers.set('Content-Security-Policy', buildCSP(nonce))
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  )
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    )
  }
}

function buildCSP(nonce: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const scriptSrc = process.env.NODE_ENV === 'development'
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`

  return [
    `default-src 'self'`,
    scriptSrc,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https: blob:`,
    `font-src 'self' data:`,
    `connect-src 'self' ${supabaseUrl} wss://${new URL(supabaseUrl).host}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ')
}

export default proxy

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
