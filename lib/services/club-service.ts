import { createClient } from '@/lib/supabase/server'
import { assertGlobalRole, getUserProfile } from '@/lib/services/permission-service'

export async function getClubs() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .order('name')

  if (error) throw new Error(error.message)
  return data || []
}

export async function createClub(
  payload: { name: string; description?: string | null; parentId?: string | null },
  actorId: string
) {
  const supabase = await createClient()
  
  // Verify actor role is administrative
  await assertGlobalRole(['admin', 'teacher', 'hod', 'manager'])

  const { data, error } = await supabase
    .from('clubs')
    .insert({
      name: payload.name,
      description: payload.description || null,
      parent_id: payload.parentId || null,
      created_by: actorId
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('A club with this name already exists.')
    }
    throw new Error(error.message)
  }

  return data
}

export async function getClubMembers(clubId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('club_members')
    .select('*, profiles(id, full_name, usn, department, semester, year, role)')
    .eq('club_id', clubId)
    .order('joined_at')

  if (error) throw new Error(error.message)
  return data || []
}

export async function addMemberToClub(
  clubId: string,
  profileId: string,
  role: string,
  actorId: string
) {
  const supabase = await createClient()
  
  // Verify actor role is administrative
  await assertGlobalRole(['admin', 'teacher', 'hod', 'manager'])

  // Insert membership
  const { error: insertError } = await supabase.from('club_members').insert({
    club_id: clubId,
    profile_id: profileId,
    role
  })

  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error('This student is already a member of this club.')
    }
    throw new Error(insertError.message)
  }

  // Automatically ensure subclub members are added to the parent club too
  const { data: clubDetails } = await supabase
    .from('clubs')
    .select('parent_id')
    .eq('id', clubId)
    .single()

  if (clubDetails?.parent_id) {
    const { data: parentMember } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', clubDetails.parent_id)
      .eq('profile_id', profileId)
      .maybeSingle()

    if (!parentMember) {
      await supabase.from('club_members').insert({
        club_id: clubDetails.parent_id,
        profile_id: profileId,
        role: 'Member'
      })
    }
  }

  // Automatically promote student's profile role to 'cc'
  const { error: roleError } = await supabase
    .from('profiles')
    .update({ role: 'cc' })
    .eq('id', profileId)

  if (roleError) throw new Error(roleError.message)
}

export async function removeMemberFromClub(memberId: string, actorId: string) {
  const supabase = await createClient()
  
  // Verify actor role is administrative
  await assertGlobalRole(['admin', 'teacher', 'hod', 'manager'])

  // Get the profile ID of the member being removed
  const { data: memberData, error: fetchError } = await supabase
    .from('club_members')
    .select('profile_id')
    .eq('id', memberId)
    .single()

  if (fetchError || !memberData) {
    throw new Error('Failed to retrieve membership data.')
  }

  const profileId = memberData.profile_id

  // Delete membership
  const { error: deleteError } = await supabase
    .from('club_members')
    .delete()
    .eq('id', memberId)

  if (deleteError) throw new Error(deleteError.message)

  // Check if they are in other clubs. If not, revert to 'student'
  const { data: otherClubs } = await supabase
    .from('club_members')
    .select('id')
    .eq('profile_id', profileId)

  if (!otherClubs || otherClubs.length === 0) {
    const { error: revertError } = await supabase
      .from('profiles')
      .update({ role: 'student' })
      .eq('id', profileId)
    
    if (revertError) throw new Error(revertError.message)
  }
}

export async function updateMemberRole(memberId: string, role: string, actorId: string) {
  const supabase = await createClient()
  
  // Verify actor role is administrative
  await assertGlobalRole(['admin', 'teacher', 'hod', 'manager'])

  const { error } = await supabase
    .from('club_members')
    .update({ role })
    .eq('id', memberId)

  if (error) throw new Error(error.message)
}
