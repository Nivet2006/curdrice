'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import * as clubService from '@/lib/services/club-service'

export async function getClubs() {
  try {
    const clubs = await clubService.getClubs()
    return { clubs }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function createClub(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const parentId = (formData.get('parentId') as string) || null

  if (!name) {
    return { error: 'Club name is required.' }
  }

  try {
    const club = await clubService.createClub(
      { name, description, parentId },
      user.id
    )
    revalidatePath('/teacher/dashboard')
    revalidatePath('/hod/dashboard')
    return { success: true, club }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getClubMembers(clubId: string) {
  try {
    const members = await clubService.getClubMembers(clubId)
    return { members }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function addMemberToClub(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const clubId = formData.get('clubId') as string
  const profileId = formData.get('profileId') as string
  const role = (formData.get('role') as string)?.trim()

  if (!clubId || !profileId || !role) {
    return { error: 'Missing required parameters.' }
  }

  try {
    await clubService.addMemberToClub(clubId, profileId, role, user.id)
    revalidatePath('/teacher/dashboard')
    revalidatePath('/hod/dashboard')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function removeMemberFromClub(memberId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await clubService.removeMemberFromClub(memberId, user.id)
    revalidatePath('/teacher/dashboard')
    revalidatePath('/hod/dashboard')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateMemberRole(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const memberId = formData.get('memberId') as string
  const role = (formData.get('role') as string)?.trim()

  if (!memberId || !role) {
    return { error: 'Missing required parameters.' }
  }

  try {
    await clubService.updateMemberRole(memberId, role, user.id)
    revalidatePath('/teacher/dashboard')
    revalidatePath('/hod/dashboard')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
