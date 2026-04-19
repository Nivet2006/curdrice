import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verify } from 'otplib'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { code, userId } = await req.json()

    if (!userId || !code) {
      return NextResponse.json({ message: 'Missing credentials' }, { status: 400 })
    }

    // Fetch secret and rate limit data with admin client
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('totp_secret, totp_enabled, totp_attempts, totp_last_attempt')
      .eq('id', userId)
      .single()

    if (!profile?.totp_enabled || !profile?.totp_secret) {
      return NextResponse.json({ message: '2FA not enabled' }, { status: 400 })
    }

    // Rate limiting check
    const MAX_ATTEMPTS = 5
    const LOCKOUT_MINUTES = 15
    const now = new Date()
    
    if (profile.totp_attempts >= MAX_ATTEMPTS && profile.totp_last_attempt) {
      const lastAttempt = new Date(profile.totp_last_attempt)
      const diffMs = now.getTime() - lastAttempt.getTime()
      const diffMins = diffMs / 1000 / 60
      
      if (diffMins < LOCKOUT_MINUTES) {
        const remaining = Math.ceil(LOCKOUT_MINUTES - diffMins)
        return NextResponse.json({ 
          success: false, 
          message: `Too many failed attempts. Security lockout active. Try again in ${remaining} minutes.` 
        }, { status: 429 })
      }
    }

    const result = await verify({
      token: code,
      secret: profile.totp_secret
    })

    if (result.valid) {
      // Reset rate limit on success
      await supabaseAdmin.from('profiles').update({
        totp_attempts: 0,
        totp_last_attempt: null
      }).eq('id', userId)

      // Set the verification cookie
      const cookieStore = await cookies()
      cookieStore.set('curdrice_totp_verified', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
        // Expires with session (no maxAge)
      })

      return NextResponse.json({ success: true })
    } else {
      // Increment attempts on failure
      const newAttempts = (profile.totp_attempts || 0) + 1
      await supabaseAdmin.from('profiles').update({
        totp_attempts: newAttempts,
        totp_last_attempt: new Date().toISOString()
      }).eq('id', userId)

      return NextResponse.json({ success: false, message: 'Identity verification failed. Invalid code.' })
    }
  } catch (error: any) {
    return NextResponse.json({ message: 'Authentication gate error' }, { status: 500 })
  }
}
