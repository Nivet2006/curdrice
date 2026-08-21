import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verify } from 'otplib'
import { cookies } from 'next/headers'
import { verifyTotpChallenge, signTotpChallenge } from '@/lib/totp-challenge'

export async function POST(req: Request) {
  try {
    const { code, keepMeLoggedIn } = await req.json()

    if (!code) {
      return NextResponse.json({ message: 'Missing code' }, { status: 400 })
    }

    // ── Security fix H1: read userId from the signed server-issued cookie ──
    // We no longer trust a client-supplied userId in the POST body.
    const cookieStore = await cookies()
    const pendingToken = cookieStore.get('curdrice_totp_pending')?.value

    if (!pendingToken) {
      return NextResponse.json({ message: 'No pending login challenge. Please log in again.' }, { status: 401 })
    }

    const userId = await verifyTotpChallenge(pendingToken)
    if (!userId) {
      // Token expired or tampered with
      cookieStore.delete('curdrice_totp_pending')
      return NextResponse.json({ message: 'Login challenge expired. Please log in again.' }, { status: 401 })
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

      // ── Security fix M4: verified cookie is user-bound (signed token), not a plain boolean ──
      // If keepMeLoggedIn is true, persist token for 30 days.
      // If false, set session cookie (no maxAge) so closing browser clears verification.
      const sessionTtl = keepMeLoggedIn ? 30 * 24 * 60 * 60 : 8 * 60 * 60
      const verifiedToken = await signTotpChallenge(userId, sessionTtl)
      
      const cookieOptions: {
        httpOnly: boolean
        secure: boolean
        sameSite: 'strict'
        path: string
        maxAge?: number
      } = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      }

      if (keepMeLoggedIn) {
        cookieOptions.maxAge = 30 * 24 * 60 * 60 // 30 days
      }

      cookieStore.set('curdrice_totp_verified', verifiedToken, cookieOptions)

      // Clear the short-lived pending challenge cookie and stale cached cookies
      cookieStore.delete('curdrice_totp_pending')
      cookieStore.delete('curdrice_user_role')
      cookieStore.delete('curdrice_user_name')
      cookieStore.delete('curdrice_user_totp')

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
