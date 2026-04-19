import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { authenticator } from 'otplib'
import qrcode from 'qrcode'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
    }

    // Generate secret
    const secret = authenticator.generateSecret()
    const otpauthUrl = authenticator.keyuri(user.email!, 'CurdRice', secret)
    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl)

    // Save secret to database (using admin client to write to sensitive column)
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ totp_secret: secret, totp_enabled: false })
      .eq('id', user.id)

    if (error) throw error

    return NextResponse.json({ qrCodeUrl, secret, otpauthUrl })
  } catch (error: any) {
    console.error('[TOTP_SETUP_ERROR]', error)
    return NextResponse.json({ message: 'Failed to initiate MFA sequence' }, { status: 500 })
  }
}
