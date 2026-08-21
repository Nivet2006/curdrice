import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { destination_url, title, custom_code } = body

    if (!destination_url || typeof destination_url !== 'string') {
      return NextResponse.json(
        { error: 'Valid destination URL is required' },
        { status: 400 }
      )
    }

    let urlToSave = destination_url.trim()
    if (!urlToSave.startsWith('http://') && !urlToSave.startsWith('https://')) {
      urlToSave = `https://${urlToSave}`
    }

    // Generate random 6-character code if custom_code is not provided
    let code = custom_code?.trim().toLowerCase()
    if (!code) {
      code = Math.random().toString(36).substring(2, 8)
    } else {
      // Validate custom code format (alphanumeric and hyphens only)
      if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
        return NextResponse.json(
          { error: 'Custom code can only contain letters, numbers, hyphens, and underscores.' },
          { status: 400 }
        )
      }
    }

    // Check if code already exists
    const { data: existing } = await supabase
      .from('qr_redirects')
      .select('id, code')
      .eq('code', code)
      .single()

    if (existing) {
      // If code was auto-generated and collided, retry with random string
      if (!custom_code) {
        code = `${code}${Math.random().toString(36).substring(2, 4)}`
      } else {
        return NextResponse.json(
          { error: 'This custom redirect code is already taken. Please pick another one.' },
          { status: 409 }
        )
      }
    }

    const { data, error } = await supabase
      .from('qr_redirects')
      .insert([
        {
          code,
          destination_url: urlToSave,
          title: title || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('[QR Redirect API] Database Insert Error:', error)
      return NextResponse.json(
        { error: 'Failed to create redirect link' },
        { status: 500 }
      )
    }

    const qrDomain = process.env.NEXT_PUBLIC_BASE_URL || 'https://cooking.nivet2006.in'

    return NextResponse.json({
      success: true,
      redirect: data,
      short_url: `https://cooking.nivet2006.in/r/${code}`,
    })
  } catch (err: any) {
    console.error('[QR Redirect API] Server Error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
