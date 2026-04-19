import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verify } from 'otplib'

export async function POST(req: Request) {
  try {
    const { code } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Fetch secret with admin client
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('totp_secret, role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' || !profile?.totp_secret) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Must provide valid code to disable (anti-lockout/anti-hijack)
    const result = await verify({
      token: code,
      secret: profile.totp_secret
    })

    if (result.valid) {
      await supabaseAdmin
        .from('profiles')
        .update({ 
            totp_enabled: false, 
            totp_secret: null 
        })
        .eq('id', user.id)

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, message: 'Invalid code. Disable sequence failed.' })
    }
  } catch (error: any) {
    return NextResponse.json({ message: 'Decommissioning error' }, { status: 500 })
  }
}
