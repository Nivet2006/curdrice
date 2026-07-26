import { createClient } from '@/lib/supabase/server'
import { assertGlobalRole, getUserProfile } from '@/lib/services/permission-service'

export async function getClubs() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clubs')
    .select('*, assigned_admin:profiles!assigned_admin_id(id, full_name, role, usn, department)')
    .order('name')

  if (error) throw new Error(error.message)
  return data || []
}

export async function createClub(
  payload: { name: string; description?: string | null; parentId?: string | null; slug?: string | null },
  actorId: string
) {
  const supabase = await createClient()
  
  // Verify actor role is administrative
  await assertGlobalRole(['admin', 'teacher', 'hod', 'manager'])

  const baseSlug = payload.slug || payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  const { data, error } = await supabase
    .from('clubs')
    .insert({
      name: payload.name,
      description: payload.description || null,
      parent_id: payload.parentId || null,
      slug: baseSlug,
      created_by: actorId
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('A club with this name or slug already exists.')
    }
    throw new Error(error.message)
  }

  // Auto-initialize default showcase configuration
  await supabase.from('club_showcase_configs').insert({
    club_id: data.id,
    hero_data: {
      title: data.name,
      subtitle: data.description || 'Welcome to our official public showcase page.',
      tagline: 'Innovate, Connect, Excel',
      ctaPrimaryText: 'Explore Events',
      ctaPrimaryUrl: '#events',
      ctaSecondaryText: 'Contact Us',
      ctaSecondaryUrl: '#contact',
      bannerUrl: ''
    }
  }).select('*').maybeSingle()

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
  
  await assertGlobalRole(['admin', 'teacher', 'hod', 'manager'])

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

  const { error: roleError } = await supabase
    .from('profiles')
    .update({ role: 'cc' })
    .eq('id', profileId)

  if (roleError) throw new Error(roleError.message)
}

export async function removeMemberFromClub(memberId: string, actorId: string) {
  const supabase = await createClient()
  
  await assertGlobalRole(['admin', 'teacher', 'hod', 'manager'])

  const { data: memberData, error: fetchError } = await supabase
    .from('club_members')
    .select('profile_id')
    .eq('id', memberId)
    .single()

  if (fetchError || !memberData) {
    throw new Error('Failed to retrieve membership data.')
  }

  const profileId = memberData.profile_id

  const { error: deleteError } = await supabase
    .from('club_members')
    .delete()
    .eq('id', memberId)

  if (deleteError) throw new Error(deleteError.message)

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
  
  await assertGlobalRole(['admin', 'teacher', 'hod', 'manager'])

  const { error } = await supabase
    .from('club_members')
    .update({ role })
    .eq('id', memberId)

  if (error) throw new Error(error.message)
}

/* =========================================================================
   PUBLIC SHOWCASE SYSTEM & CUSTOMIZER SERVICES
   ========================================================================= */

export async function getClubBySlugOrId(slugOrId: string) {
  const supabase = await createClient()
  
  let { data: club } = await supabase
    .from('clubs')
    .select('*, assigned_admin:profiles!assigned_admin_id(id, full_name, usn, department, role)')
    .eq('slug', slugOrId)
    .maybeSingle()

  if (!club) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(slugOrId)
    if (isUuid) {
      const res = await supabase
        .from('clubs')
        .select('*, assigned_admin:profiles!assigned_admin_id(id, full_name, usn, department, role)')
        .eq('id', slugOrId)
        .maybeSingle()
      club = res.data
    }
  }

  return club
}

export async function getClubShowcaseData(slugOrId: string) {
  const supabase = await createClient()
  const club = await getClubBySlugOrId(slugOrId)

  if (!club) return null

  let { data: config } = await supabase
    .from('club_showcase_configs')
    .select('*')
    .eq('club_id', club.id)
    .maybeSingle()

  if (!config) {
    const { data: newConfig } = await supabase
      .from('club_showcase_configs')
      .insert({
        club_id: club.id,
        hero_data: {
          title: club.name,
          subtitle: club.description || 'Welcome to our official public showcase page.',
          tagline: 'Innovate, Connect, Excel',
          ctaPrimaryText: 'Explore Events',
          ctaPrimaryUrl: '#events',
          ctaSecondaryText: 'Contact Us',
          ctaSecondaryUrl: '#contact',
          bannerUrl: ''
        }
      })
      .select('*')
      .single()
    config = newConfig
  }

  const [
    { data: testimonials },
    { data: gallery },
    { data: blogs },
    { data: tools },
    { data: surveys },
    { data: events },
    { data: members }
  ] = await Promise.all([
    supabase.from('club_testimonials').select('*').eq('club_id', club.id).order('display_order'),
    supabase.from('club_gallery').select('*').eq('club_id', club.id).order('display_order'),
    supabase.from('club_blogs').select('*').eq('club_id', club.id).order('published_at', { ascending: false }),
    supabase.from('club_tools').select('*').eq('club_id', club.id).order('display_order'),
    supabase.from('club_surveys').select('*').eq('club_id', club.id).order('created_at', { ascending: false }),
    supabase.from('events').select('*').ilike('club_name', `%${club.name}%`).order('event_date', { ascending: false }),
    supabase.from('club_members').select('*, profiles(id, full_name, usn, department, role)').eq('club_id', club.id)
  ])

  return {
    club,
    config,
    testimonials: testimonials || [],
    gallery: gallery || [],
    blogs: blogs || [],
    tools: tools || [],
    surveys: surveys || [],
    events: events || [],
    members: members || []
  }
}

export async function updateClubSlug(clubId: string, rawSlug: string, actorId: string) {
  const supabase = await createClient()
  await assertCanManageClubShowcase(clubId, actorId)

  const cleanSlug = rawSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')

  if (!cleanSlug) {
    throw new Error('Please enter a valid custom URL slug.')
  }

  const { error } = await supabase
    .from('clubs')
    .update({ slug: cleanSlug })
    .eq('id', clubId)

  if (error) {
    if (error.code === '23505') {
      throw new Error('This custom URL slug is already taken by another club.')
    }
    throw new Error(error.message)
  }

  return cleanSlug
}

export async function assignClubAdmin(clubId: string, profileId: string | null, actorId: string) {
  const supabase = await createClient()
  await assertGlobalRole(['admin', 'teacher', 'hod', 'manager'])

  const { error } = await supabase
    .from('clubs')
    .update({ assigned_admin_id: profileId })
    .eq('id', clubId)

  if (error) throw new Error(error.message)
}

export async function updateClubShowcaseConfig(
  clubId: string,
  payload: {
    theme_config?: any
    navbar_config?: any
    sections_order?: any
    sections_enabled?: any
    hero_data?: any
    about_data?: any
    contact_config?: any
  },
  actorId: string
) {
  const supabase = await createClient()
  await assertCanManageClubShowcase(clubId, actorId)

  const { data, error } = await supabase
    .from('club_showcase_configs')
    .upsert({
      club_id: clubId,
      ...payload,
      updated_at: new Date().toISOString()
    }, { onConflict: 'club_id' })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function assertCanManageClubShowcase(clubId: string, actorId: string) {
  const supabase = await createClient()
  const authContext = await getUserProfile()
  
  if (['admin', 'teacher', 'hod', 'manager'].includes(authContext.profile?.role)) {
    return true
  }

  const { data: club } = await supabase
    .from('clubs')
    .select('assigned_admin_id')
    .eq('id', clubId)
    .single()

  if (club?.assigned_admin_id === actorId) {
    return true
  }

  throw new Error('Unauthorized to manage this club showcase page.')
}

export async function addTestimonial(clubId: string, payload: any, actorId: string) {
  const supabase = await createClient()
  await assertCanManageClubShowcase(clubId, actorId)

  const { error } = await supabase.from('club_testimonials').insert({ club_id: clubId, ...payload })
  if (error) throw new Error(error.message)
}

export async function deleteTestimonial(id: string, actorId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('club_testimonials').select('club_id').eq('id', id).single()
  if (data) await assertCanManageClubShowcase(data.club_id, actorId)

  const { error } = await supabase.from('club_testimonials').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addGalleryImage(clubId: string, payload: any, actorId: string) {
  const supabase = await createClient()
  await assertCanManageClubShowcase(clubId, actorId)

  const { error } = await supabase.from('club_gallery').insert({ club_id: clubId, ...payload })
  if (error) throw new Error(error.message)
}

export async function deleteGalleryImage(id: string, actorId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('club_gallery').select('club_id').eq('id', id).single()
  if (data) await assertCanManageClubShowcase(data.club_id, actorId)

  const { error } = await supabase.from('club_gallery').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addBlogArticle(clubId: string, payload: any, actorId: string) {
  const supabase = await createClient()
  await assertCanManageClubShowcase(clubId, actorId)

  const blogSlug = payload.title.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
  const { error } = await supabase.from('club_blogs').insert({ club_id: clubId, slug: blogSlug, ...payload })
  if (error) throw new Error(error.message)
}

export async function deleteBlogArticle(id: string, actorId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('club_blogs').select('club_id').eq('id', id).single()
  if (data) await assertCanManageClubShowcase(data.club_id, actorId)

  const { error } = await supabase.from('club_blogs').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addToolItem(clubId: string, payload: any, actorId: string) {
  const supabase = await createClient()
  await assertCanManageClubShowcase(clubId, actorId)

  const { error } = await supabase.from('club_tools').insert({ club_id: clubId, ...payload })
  if (error) throw new Error(error.message)
}

export async function deleteToolItem(id: string, actorId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('club_tools').select('club_id').eq('id', id).single()
  if (data) await assertCanManageClubShowcase(data.club_id, actorId)

  const { error } = await supabase.from('club_tools').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addSurveyItem(clubId: string, payload: any, actorId: string) {
  const supabase = await createClient()
  await assertCanManageClubShowcase(clubId, actorId)

  const { error } = await supabase.from('club_surveys').insert({ club_id: clubId, ...payload })
  if (error) throw new Error(error.message)
}

export async function deleteSurveyItem(id: string, actorId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('club_surveys').select('club_id').eq('id', id).single()
  if (data) await assertCanManageClubShowcase(data.club_id, actorId)

  const { error } = await supabase.from('club_surveys').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function submitClubInquiry(clubId: string, payload: { sender_name: string; sender_email: string; subject?: string; message: string }) {
  const supabase = await createClient()
  const { error } = await supabase.from('club_inquiries').insert({ club_id: clubId, ...payload })
  if (error) throw new Error(error.message)
}

export async function getClubInquiries(clubId: string, actorId: string) {
  const supabase = await createClient()
  await assertCanManageClubShowcase(clubId, actorId)

  const { data, error } = await supabase
    .from('club_inquiries')
    .select('*')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
