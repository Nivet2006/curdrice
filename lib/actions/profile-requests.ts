'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function getAdminClient() {
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) =>
          fetch(url, { ...options, cache: 'no-store' })
      }
    }
  )
}

const ALLOWED_FIELDS = ['full_name', 'usn', 'department', 'semester', 'year']

export async function submitProfileUpdateRequest(field: string, newValue: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Validate field
  if (!ALLOWED_FIELDS.includes(field)) {
    return { error: `Field "${field}" cannot be updated via request.` }
  }

  // Get current profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found.' }

  // Check if there's already a pending request for this field
  const { data: existing } = await supabase
    .from('profile_update_requests')
    .select('id')
    .eq('student_id', user.id)
    .eq('field', field)
    .eq('status', 'pending')

  if (existing && existing.length > 0) {
    return { error: 'You already have a pending request for this field.' }
  }

  const currentValue = String((profile as any)[field] ?? '')

  const { error } = await supabase
    .from('profile_update_requests')
    .insert({
      student_id: user.id,
      field,
      current_value: currentValue,
      new_value: newValue,
    })

  if (error) return { error: error.message }

  revalidatePath('/student/profile')
  return { success: true }
}

export async function getStudentUpdateRequests() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', data: [] }

  const { data, error } = await supabase
    .from('profile_update_requests')
    .select('*')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, data: [] }
  return { data: data || [], error: null }
}

export async function getPendingProfileRequests(dept: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', data: [] }

  // Verify HOD/admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['hod', 'admin'].includes(profile.role)) {
    return { error: 'Unauthorized: Requires HOD permissions.', data: [] }
  }

  const adminClient = getAdminClient()

  // Fetch pending requests joined with student profiles in the given department
  const { data, error } = await adminClient
    .from('profile_update_requests')
    .select('*, profiles!profile_update_requests_student_id_fkey(full_name, usn, department, semester, year)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) return { error: error.message, data: [] }

  // Filter to only students in the HOD's department
  const filtered = (data || []).filter((r: any) => r.profiles?.department === dept)

  return { data: filtered, error: null }
}

export async function processProfileRequest(
  requestId: string,
  decision: 'approve' | 'reject',
  feedback: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['hod', 'admin'].includes(profile.role)) {
    return { error: 'Unauthorized: Requires HOD permissions.' }
  }

  const adminClient = getAdminClient()

  if (decision === 'approve') {
    // Fetch the request to get student_id and field/new_value
    const { data: request } = await adminClient
      .from('profile_update_requests')
      .select('student_id, field, new_value')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single()

    if (!request) return { error: 'Request not found or already processed.' }

    // Apply the update to the profile
    let value: any = request.new_value
    if (['semester', 'year'].includes(request.field)) {
      value = parseInt(value, 10)
    }
    if (request.field === 'usn') {
      value = value.toUpperCase()
    }

    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ [request.field]: value })
      .eq('id', request.student_id)

    if (updateError) return { error: updateError.message }
  }

  // Update request status
  const { error: statusError } = await adminClient
    .from('profile_update_requests')
    .update({
      status: decision === 'approve' ? 'approved' : 'rejected',
      feedback: feedback || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (statusError) return { error: statusError.message }

  revalidatePath('/hod/dashboard')
  revalidatePath('/student/profile')
  return { success: true }
}
