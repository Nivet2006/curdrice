import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { authenticator } from 'otplib'

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
      .select('totp_secret')
      .eq('id', user.id)
      .single()

    if (!profile?.totp_secret) {
      return NextResponse.json({ message: 'Setup not initiated' }, { status: 400 })
    }

    // Verify code
    const isValid = authenticator.verify({
      token: code,
      secret: profile.totp_secret
    })

    if (isValid) {
      // Finalize setup
      await supabaseAdmin
        .from('profiles')
        .update({ totp_enabled: true })
        .eq('id', user.id)

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, message: 'Invalid verification code' })
    }
  } catch (error: any) {
    return NextResponse.json({ message: 'Verification sequence failed' }, { status: 500 })
  }
}
