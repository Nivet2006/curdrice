'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getClubs() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .order('name')

  if (error) return { error: error.message }
  return { clubs: data || [] }
}

export async function createClub(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'teacher', 'hod', 'manager'].includes(profile.role)) {
    return { error: 'Unauthorized: Only faculty, HODs, or admins can create clubs.' }
  }

  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const parentId = (formData.get('parentId') as string) || null

  if (!name) {
    return { error: 'Club name is required.' }
  }

  const { data, error } = await supabase.from('clubs').insert({
    name,
    description,
    parent_id: parentId,
    created_by: user.id
  }).select('*').single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'A club with this name already exists.' }
    }
    return { error: error.message }
  }

  revalidatePath('/teacher/dashboard')
  revalidatePath('/hod/dashboard')
  return { success: true, club: data }
}

export async function getClubMembers(clubId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('club_members')
    .select('*, profiles(id, full_name, usn, department, semester, year, role)')
    .eq('club_id', clubId)
    .order('joined_at')

  if (error) return { error: error.message }
  return { members: data || [] }
}

export async function addMemberToClub(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'teacher', 'hod', 'manager'].includes(profile.role)) {
    return { error: 'Unauthorized: Only faculty, HODs, or admins can manage club members.' }
  }

  const clubId = formData.get('clubId') as string
  const profileId = formData.get('profileId') as string
  const role = (formData.get('role') as string)?.trim()

  if (!clubId || !profileId || !role) {
    return { error: 'Missing required parameters.' }
  }

  // Insert membership
  const { error: insertError } = await supabase.from('club_members').insert({
    club_id: clubId,
    profile_id: profileId,
    role
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return { error: 'This student is already a member of this club.' }
    }
    return { error: insertError.message }
  }

  // Automatically promote student's profile role to 'cc'
  await supabase
    .from('profiles')
    .update({ role: 'cc' })
    .eq('id', profileId)

  revalidatePath('/teacher/dashboard')
  revalidatePath('/hod/dashboard')
  return { success: true }
}

export async function removeMemberFromClub(memberId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'teacher', 'hod', 'manager'].includes(profile.role)) {
    return { error: 'Unauthorized: Only faculty, HODs, or admins can manage club members.' }
  }

  // Get the profile ID of the member being removed
  const { data: memberData, error: fetchError } = await supabase
    .from('club_members')
    .select('profile_id')
    .eq('id', memberId)
    .single()

  if (fetchError || !memberData) {
    return { error: 'Failed to retrieve membership data.' }
  }

  const profileId = memberData.profile_id

  // Delete membership
  const { error: deleteError } = await supabase
    .from('club_members')
    .delete()
    .eq('id', memberId)

  if (deleteError) return { error: deleteError.message }

  // Check if they are in other clubs. If not, revert to 'student'
  const { data: otherClubs } = await supabase
    .from('club_members')
    .select('id')
    .eq('profile_id', profileId)

  if (!otherClubs || otherClubs.length === 0) {
    await supabase
      .from('profiles')
      .update({ role: 'student' })
      .eq('id', profileId)
  }

  revalidatePath('/teacher/dashboard')
  revalidatePath('/hod/dashboard')
  return { success: true }
}

export async function updateMemberRole(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'teacher', 'hod', 'manager'].includes(profile.role)) {
    return { error: 'Unauthorized: Only faculty, HODs, or admins can manage club roles.' }
  }

  const memberId = formData.get('memberId') as string
  const role = (formData.get('role') as string)?.trim()

  if (!memberId || !role) {
    return { error: 'Missing required parameters.' }
  }

  const { error } = await supabase
    .from('club_members')
    .update({ role })
    .eq('id', memberId)

  if (error) return { error: error.message }

  revalidatePath('/teacher/dashboard')
  revalidatePath('/hod/dashboard')
  return { success: true }
}
