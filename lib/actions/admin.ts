'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Role } from '@/lib/types'

import { assertAdmin } from '@/lib/services/permission-service'

export async function createUserAdmin(formData: FormData) {
  try {
    await assertAdmin()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const usn = formData.get('usn') as string
    const department = formData.get('department') as string
    const semester = parseInt(formData.get('semester') as string, 10)
    const year = parseInt(formData.get('year') as string, 10)
    const role = formData.get('role') as Role

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) throw authError

    if (authData.user) {
      const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        id: authData.user.id,
        full_name: fullName,
        usn: usn.toUpperCase(),
        department,
        semester,
        year,
        role
      })
      if (profileError) throw profileError
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'Failed to create user securely' }
  }
}

export async function updateUserRole(userId: string, newRole: Role) {
  try {
    await assertAdmin()
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    if (error) throw error
    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'Failed to update user' }
  }
}

export async function deleteUser(userId: string) {
  try {
    await assertAdmin()
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'deleted' })
      .eq('id', userId)
    if (error) throw error
    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'Failed to suspend user' }
  }
}

export async function updateUserDetails(
  userId: string,
  details: {
    full_name: string
    usn: string
    department: string
    semester: number
    year: number
  }
) {
  try {
    await assertAdmin()
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: details.full_name,
        usn: details.usn.toUpperCase(),
        department: details.department,
        semester: details.semester,
        year: details.year
      })
      .eq('id', userId)
    if (error) throw error
    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'Failed to update user details' }
  }
}

export async function manualCheckIn(usn: string, eventId: string) {
  try {
    await assertAdmin()

    const { data: student, error: studentError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('usn', usn.toUpperCase())
      .single()
      
    if (studentError || !student) return { error: `Student with USN ${usn.toUpperCase()} not found in system.` }

    const { data: registration, error: regError } = await supabaseAdmin
      .from('registrations')
      .select('id, checked_in')
      .eq('student_id', student.id)
      .eq('event_id', eventId)
      .single()

    if (regError || !registration) return { error: `Student ${usn.toUpperCase()} is not registered for this event.` }
    if (registration.checked_in) return { error: `Student ${usn.toUpperCase()} is already checked in.` }

    const { error: updateError } = await supabaseAdmin
      .from('registrations')
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq('id', registration.id)

    if (updateError) return { error: updateError.message }

    revalidatePath(`/admin/attendance/${eventId}`)
    return { success: true, message: `Successfully checked in ${usn.toUpperCase()}` }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'Unauthorized Action' }
  }
}

export async function verifyAdminPassword(password: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return { error: 'Not authenticated' }

    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password
    })

    if (error) return { error: 'Incorrect password. Action cancelled.' }
    return { success: true }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'Verification failed' }
  }
}

