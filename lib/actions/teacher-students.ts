'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

import { assertTeacherOrAdmin } from '@/lib/services/permission-service'

export async function getDepartmentStudents(dept: string) {
  const supabase = await createClient()
  await assertTeacherOrAdmin()

  const adminClient = supabaseAdmin

  const { data, error } = await adminClient
    .from('profiles')
    .select('id, full_name, usn, department, semester, year, role, created_at, has_backlog, year_back, username')
    .eq('role', 'student')
    .eq('department', dept)
    .order('full_name')

  if (error) return { error: error.message, data: [] }
  return { data: data || [], error: null }
}

export async function bulkPromoteStudents(
  studentIds: string[],
  newSemester: number,
  newYear: number
) {
  try {
    const supabase = await createClient()
    await assertTeacherOrAdmin()

    const adminClient = supabaseAdmin

    const { error } = await adminClient
      .from('profiles')
      .update({ semester: newSemester, year: newYear })
      .in('id', studentIds)

    if (error) return { error: error.message }

    revalidatePath('/teacher/dashboard')
    return { success: true, count: studentIds.length }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'Failed to promote students' }
  }
}

export async function updateStudentByTeacher(
  studentId: string,
  details: {
    full_name?: string
    usn?: string
    department?: string
    semester?: number
    year?: number
    has_backlog?: boolean
    year_back?: boolean
  }
) {
  try {
    const supabase = await createClient()
    await assertTeacherOrAdmin()

    const adminClient = supabaseAdmin

    // Uppercase USN if provided
    const updateData: Record<string, any> = { ...details }
    if (updateData.usn) {
      updateData.usn = updateData.usn.toUpperCase()
    }

    const { error } = await adminClient
      .from('profiles')
      .update(updateData)
      .eq('id', studentId)

    if (error) return { error: error.message }

    revalidatePath('/teacher/dashboard')
    return { success: true }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'Failed to update student' }
  }
}
