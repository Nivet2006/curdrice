import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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

  // Attempt to get user with error handling
  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()

    // Handle refresh token errors gracefully
    if (error) {
      if (error.message?.includes('refresh_token_not_found') ||
        error.message?.includes('Invalid Refresh Token')) {
        // Clear all auth cookies to prevent repeated errors
        const response = NextResponse.next()
        const cookiesToClear = request.cookies.getAll().filter(cookie =>
          cookie.name.startsWith('sb-') || cookie.name.includes('auth-token')
        )

        cookiesToClear.forEach(cookie => {
          response.cookies.delete(cookie.name)
        })

        // Only redirect to login if not already on auth page
        const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
          request.nextUrl.pathname.startsWith('/register')

        if (!isAuthPage && request.nextUrl.pathname !== '/') {
          const url = request.nextUrl.clone()
          url.pathname = '/login'
          return NextResponse.redirect(url)
        }

        return response
      }

      // Log other auth errors in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Middleware] Auth error:', error.message)
      }
    }

    user = data?.user || null
  } catch (error: any) {
    // Catch any unexpected errors during auth check
    if (process.env.NODE_ENV === 'development') {
      console.error('[Middleware] Unexpected auth error:', error.message)
    }
    user = null
  }

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
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role || 'student'

      // Block suspended accounts
      if (role === 'deleted') {
        // Clear session and redirect to login
        await supabase.auth.signOut()
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('error', 'account_suspended')
        return NextResponse.redirect(url)
      }

      // Redirect authenticated users away from auth pages
      if (isAuthPage) {
        const url = request.nextUrl.clone()
        url.pathname = `/${role}/dashboard`
        return NextResponse.redirect(url)
      }

      // Role-based access control
      const path = request.nextUrl.pathname

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
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Middleware] Profile fetch error:', error.message)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}