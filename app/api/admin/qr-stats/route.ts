import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // 1. Verify caller is an Admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

    const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
    })

    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // 2. Fetch all QR redirects and click counts
    const { data: redirects, error } = await supabaseAdmin
      .from('qr_redirects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Admin QR Stats API] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 3. Compute Summary Metrics
    const totalRedirects = redirects.length
    const totalClicks = redirects.reduce((sum, r) => sum + (r.clicks || 0), 0)
    const topPerforming = redirects.length > 0
      ? [...redirects].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0]
      : null

    return NextResponse.json({
      success: true,
      stats: {
        totalRedirects,
        totalClicks,
        topPerforming,
      },
      redirects,
    })
  } catch (err: any) {
    console.error('[Admin QR Stats API] Exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

    const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    })

    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Redirect ID required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('qr_redirects').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

    const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    })

    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, destination_url, title } = body

    if (!id) {
      return NextResponse.json({ error: 'Redirect ID is required' }, { status: 400 })
    }

    if (!destination_url || typeof destination_url !== 'string' || !destination_url.trim()) {
      return NextResponse.json({ error: 'Destination URL cannot be empty' }, { status: 400 })
    }

    let urlToSave = destination_url.trim()
    if (!urlToSave.startsWith('http://') && !urlToSave.startsWith('https://')) {
      urlToSave = `https://${urlToSave}`
    }

    const { data: updated, error } = await supabaseAdmin
      .from('qr_redirects')
      .update({
        destination_url: urlToSave,
        title: title !== undefined ? title : null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Admin QR Stats PATCH Error]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, redirect: updated })
  } catch (err: any) {
    console.error('[Admin QR Stats PATCH Exception]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
