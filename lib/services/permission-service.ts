import { createClient } from '@/lib/supabase/server'
import type { Role } from '@/lib/types'

export class PermissionDeniedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message)
    this.name = 'PermissionDeniedError'
  }
}

/**
 * Asserts that the currently authenticated user has one of the allowed global roles.
 * @throws PermissionDeniedError if not authenticated or role is insufficient.
 */
export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new PermissionDeniedError('Unauthorized: Not authenticated')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new PermissionDeniedError('Unauthorized: Profile not found')
  }

  return { user, profile, supabase }
}

/**
 * Asserts that the currently authenticated user has one of the allowed global roles.
 * @throws PermissionDeniedError if not authenticated or role is insufficient.
 */
export async function assertGlobalRole(allowedRoles: Role[]): Promise<{ userId: string; role: Role; profile: any }> {
  const { user, profile } = await getUserProfile()
  const userRole = profile.role as Role

  if (!allowedRoles.includes(userRole)) {
    throw new PermissionDeniedError(`Unauthorized: Requires one of roles: ${allowedRoles.join(', ')}`)
  }

  return { userId: user.id, role: userRole, profile }
}


/**
 * Checks if the currently authenticated user has one of the allowed global roles, without throwing.
 */
export async function hasGlobalRole(allowedRoles: Role[]): Promise<boolean> {
  try {
    await assertGlobalRole(allowedRoles)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Asserts that the currently authenticated user is an Admin.
 */
export async function assertAdmin() {
  return assertGlobalRole(['admin'])
}

/**
 * Asserts that the currently authenticated user has CC level permissions or higher.
 */
export async function assertCC() {
  return assertGlobalRole(['cc', 'manager', 'admin'])
}

/**
 * Asserts that the currently authenticated user has PR level permissions or higher.
 */
export async function assertPR() {
  return assertGlobalRole(['pr', 'admin'])
}

/**
 * Asserts that the currently authenticated user has Teacher level permissions or higher.
 */
export async function assertTeacherOrAdmin() {
  return assertGlobalRole(['teacher', 'hod', 'admin'])
}

/**
 * Asserts that the currently authenticated user has HOD level permissions or higher.
 */
export async function assertHODOrAdmin() {
  return assertGlobalRole(['hod', 'admin'])
}

export async function assertManager() {
  return assertGlobalRole(['manager', 'admin'])
}

/**
 * Asserts that the user is either the owner (matches ownerId) or has one of the allowed roles.
 */
export async function assertOwnershipOrRoles(ownerId: string, allowedRoles: Role[]) {
  const { user, profile } = await getUserProfile()
  if (user.id === ownerId) return { user, profile }
  
  const userRole = profile.role as Role
  if (allowedRoles.includes(userRole)) return { user, profile }
  
  throw new PermissionDeniedError(`Unauthorized: Must be resource owner or have one of roles: ${allowedRoles.join(', ')}`)
}
