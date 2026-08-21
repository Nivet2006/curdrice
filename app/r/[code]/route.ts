import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    if (!code) {
      return NextResponse.redirect(new URL('/qr', request.url))
    }

    const cleanCode = code.toLowerCase().trim()

    // 1. Fetch destination URL from database
    const { data, error } = await supabase
      .from('qr_redirects')
      .select('id, destination_url, clicks')
      .eq('code', cleanCode)
      .single()

    if (error || !data) {
      console.warn(`[Redirect Handler] Code "${cleanCode}" not found. Forwarding to /qr page.`)
      return NextResponse.redirect(new URL('/qr?error=not_found', request.url))
    }

    // 2. Update click metrics and record log entry (await to guarantee database persist)
    const userAgent = request.headers.get('user-agent') || undefined
    const referer = request.headers.get('referer') || undefined

    try {
      const currentClicks = typeof data.clicks === 'number' ? data.clicks : 0
      await Promise.all([
        supabase
          .from('qr_redirects')
          .update({
            clicks: currentClicks + 1,
            last_clicked_at: new Date().toISOString(),
          })
          .eq('id', data.id),
        supabase.from('qr_redirect_logs').insert([
          {
            redirect_id: data.id,
            user_agent: userAgent,
            referer: referer,
          },
        ]),
      ])
    } catch (metricsErr) {
      console.error('[Redirect Metrics Error]', metricsErr)
    }

    // 3. Forward user to target destination
    return NextResponse.redirect(data.destination_url, 307)
  } catch (err: any) {
    console.error('[Redirect Handler Exception]', err)
    return NextResponse.redirect(new URL('/qr', request.url))
  }
}
