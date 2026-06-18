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
    path.match(/\.(png|jpg|svg|ico|webp|css|js|html|txt|xml)$/)
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
          return getUnauthorizedResponse();
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
      return getUnauthorizedResponse();
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

function getUnauthorizedResponse() {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ClubEve API Node</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Roboto+Mono:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0a0a0a;
            --bg-subtle: #1a1a1a;
            --bg-card: #141414;
            --fg: #f5f5f5;
            --fg-muted: #a0a0a0;
            --border: #2a2a2a;
            --accent: #f5f5f5;
            --accent-fg: #0a0a0a;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg);
            /* Dotted background pattern from Style Guide */
            background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px);
            background-size: 24px 24px;
            color: var(--fg);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            position: relative;
            overflow: hidden;
        }

        /* Large low-opacity grid lines for industrial brutalist structure */
        body::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
            background-size: 120px 120px;
            z-index: 0;
            pointer-events: none;
        }

        /* Brutalist Modular Card */
        .card {
            background-color: var(--bg-card);
            border: 2px solid var(--border);
            border-radius: 20px;
            padding: 3rem 2.5rem;
            width: 100%;
            max-width: 480px;
            text-align: center;
            z-index: 10;
            box-shadow: 6px 6px 0px 0px var(--border);
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            position: relative;
        }

        .card:hover {
            border-color: #ffffff;
            box-shadow: 10px 10px 0px 0px #ffffff;
            transform: translate(-4px, -4px);
        }

        /* Mono Technical Pill */
        .badge {
            font-family: 'Roboto Mono', monospace;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border);
            color: var(--fg-muted);
            padding: 8px 16px;
            border-radius: 50px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 2rem;
            font-weight: 600;
        }

        .badge-dot {
            width: 6px;
            height: 6px;
            background-color: var(--border);
            border-radius: 50%;
            transition: background-color 0.3s ease;
        }

        .card:hover .badge-dot {
            background-color: #ffffff;
        }

        h1 {
            font-size: 2.25rem;
            font-weight: 900;
            line-height: 1.1;
            margin-bottom: 1.25rem;
            letter-spacing: -0.04em;
            text-transform: uppercase;
            color: #ffffff;
        }

        p {
            font-size: 1rem;
            color: var(--fg-muted);
            line-height: 1.6;
            margin-bottom: 2.5rem;
            font-weight: 400;
        }

        /* Brutalist Button & Hover Transforms */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background-color: var(--accent);
            color: var(--accent-fg);
            text-decoration: none;
            padding: 1.1rem 2rem;
            font-size: 1rem;
            font-weight: 900;
            border-radius: 12px;
            border: 2px solid var(--accent);
            cursor: pointer;
            width: 100%;
            font-family: 'Outfit', sans-serif;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            transition: all 0.2s ease;
            box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.5);
        }

        .btn:hover {
            background-color: var(--bg-card);
            color: #ffffff;
            border-color: #ffffff;
            transform: translate(-3px, -3px);
            box-shadow: 6px 6px 0px 0px #ffffff;
        }

        .btn:active {
            transform: translate(1px, 1px);
            box-shadow: 2px 2px 0px 0px #ffffff;
        }

        /* Mono Operational Status Pill */
        .status-container {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-family: 'Roboto Mono', monospace;
            font-size: 0.75rem;
            background: rgba(46, 213, 115, 0.08);
            color: #2ed573;
            padding: 6px 14px;
            border-radius: 8px;
            margin-top: 2rem;
            border: 1.5px solid rgba(46, 213, 115, 0.2);
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background-color: #2ed573;
            border-radius: 50%;
            box-shadow: 0 0 8px #2ed573;
            animation: pulse 1.8s infinite;
        }

        @keyframes pulse {
            0% { transform: scale(0.9); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.5; }
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge">
            <span class="badge-dot"></span>
            Node // CE-Proxy-01
        </div>
        <h1>ClubEve API</h1>
        <p>You have accessed the secure ClubEve Backend Node. This server handles digital keys, event check-ins, and automated administration for ClubEve App.</p>
        
        <a href="https://curdrice.nivet2006.in/login" class="btn">
            Go to ClubEve
        </a>

        <div>
            <div class="status-container">
                <span class="status-dot"></span>
                Status: Operational
            </div>
        </div>
    </div>
</body>
</html>
  `;
  return new NextResponse(htmlContent, {
    status: 401,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

export default proxy

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
