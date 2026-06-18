'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { signTotpChallenge } from '@/lib/totp-challenge'

export async function login(identifier: string, pass: string) {
  let email = identifier;

  // If the identifier doesn't look like an email, assume it's a USN
  if (!identifier.includes('@')) {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('usn', identifier)
      .single()

    if (!profile) {
      return { error: 'Invalid Credentials' }
    }

    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(profile.id)
    
    if (!authData.user?.email) {
      return { error: 'Invalid Credentials' }
    }
    
    email = authData.user.email
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  })

  if (error) {
    return { error: error.message }
  }

  // Determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, totp_enabled')
    .eq('id', data.user.id)
    .single()
  
  if (profile?.role === 'deleted') {
    await supabase.auth.signOut()
    return { error: 'Account suspended' }
  }

  const role = profile?.role || 'student'
  
  // If TOTP is required, set a signed server-side pending-challenge cookie.
  // This means the verify-login route does NOT need to trust the client-supplied userId.
  if (!!profile?.totp_enabled) {
    const challengeToken = await signTotpChallenge(data.user.id, 300) // 5-min TTL
    const cookieStore = await cookies()
    cookieStore.set('curdrice_totp_pending', challengeToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 300, // 5 minutes
      path: '/',
    })
    return { success: true, role, totpEnabled: true }
  }

  // ✅ Return success with role (no userId exposed — not needed when TOTP is disabled)
  return { 
    success: true, 
    role, 
    totpEnabled: false
  }
}

const registerSchema = z.object({
  fullName: z.string().min(2),
  usn: z.string().regex(/^\d[A-Z]{2}\d{2}[A-Z]{2}\d{3}$/, 'Invalid USN format'),
  department: z.string(),
  semester: z.coerce.number().min(1).max(8),
  year: z.coerce.number().min(1).max(4),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6)
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

export async function registerProfile(formData: FormData) {
  const data = Object.fromEntries(formData)
  const result = registerSchema.safeParse(data)
  
  if (!result.success) {
    return { error: result.error.issues[0]?.message || 'Validation failed' }
  }

  const supabase = await createClient()
  
  const { data: authData, error: signupError } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
  })

  if (signupError) {
    return { error: signupError.message }
  }

  if (authData.user) {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      full_name: result.data.fullName,
      usn: result.data.usn.toUpperCase(),
      department: result.data.department,
      semester: result.data.semester,
      year: result.data.year,
      role: 'student'
    })

    if (profileError) {
      return { error: profileError.message }
    }
  }

  // ✅ Return success instead of redirecting
  return { success: true, role: 'student' }
}