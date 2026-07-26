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

/* =========================================================================
   PUBLIC SHOWCASE ACTIONS
   ========================================================================= */

export async function getClubShowcaseData(slugOrId: string) {
  try {
    const data = await clubService.getClubShowcaseData(slugOrId)
    return { data }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateClubSlugAction(clubId: string, newSlug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const cleanSlug = await clubService.updateClubSlug(clubId, newSlug, user.id)
    revalidatePath('/c/[slug]', 'page')
    revalidatePath('/teacher/dashboard')
    revalidatePath('/dashboard')
    return { success: true, slug: cleanSlug }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function assignClubAdminAction(clubId: string, profileId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await clubService.assignClubAdmin(clubId, profileId, user.id)
    revalidatePath('/teacher/dashboard')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateShowcaseConfigAction(clubId: string, configPayload: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const config = await clubService.updateClubShowcaseConfig(clubId, configPayload, user.id)
    revalidatePath('/c/[slug]', 'page')
    return { success: true, config }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function addTestimonialAction(clubId: string, payload: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await clubService.addTestimonial(clubId, payload, user.id)
    revalidatePath('/c/[slug]', 'page')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteTestimonialAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await clubService.deleteTestimonial(id, user.id)
    revalidatePath('/c/[slug]', 'page')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function addGalleryImageAction(clubId: string, payload: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await clubService.addGalleryImage(clubId, payload, user.id)
    revalidatePath('/c/[slug]', 'page')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteGalleryImageAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await clubService.deleteGalleryImage(id, user.id)
    revalidatePath('/c/[slug]', 'page')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function addBlogArticleAction(clubId: string, payload: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await clubService.addBlogArticle(clubId, payload, user.id)
    revalidatePath('/c/[slug]', 'page')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteBlogArticleAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await clubService.deleteBlogArticle(id, user.id)
    revalidatePath('/c/[slug]', 'page')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function addToolItemAction(clubId: string, payload: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await clubService.addToolItem(clubId, payload, user.id)
    revalidatePath('/c/[slug]', 'page')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteToolItemAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await clubService.deleteToolItem(id, user.id)
    revalidatePath('/c/[slug]', 'page')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function addSurveyItemAction(clubId: string, payload: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await clubService.addSurveyItem(clubId, payload, user.id)
    revalidatePath('/c/[slug]', 'page')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteSurveyItemAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await clubService.deleteSurveyItem(id, user.id)
    revalidatePath('/c/[slug]', 'page')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function submitClubInquiryAction(clubId: string, payload: { sender_name: string; sender_email: string; subject?: string; message: string }) {
  try {
    await clubService.submitClubInquiry(clubId, payload)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getClubInquiriesAction(clubId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const inquiries = await clubService.getClubInquiries(clubId, user.id)
    return { inquiries }
  } catch (error: any) {
    return { error: error.message }
  }
}
