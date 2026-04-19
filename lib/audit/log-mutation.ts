import { writeAuditLog } from './write-log'
import { cookies } from 'next/headers'

export async function logMutation(opts: {
  userId?: string
  userEmail?: string
  userName?: string
  userRole?: string
  action: string
  path: string
  metadata?: Record<string, any>
}) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('cr_session_id')?.value || 'no-session'

  await writeAuditLog({
    session_id: sessionId,
    user_id: opts.userId,
    user_email: opts.userEmail,
    user_name: opts.userName,
    user_role: opts.userRole,
    action_type: 'MUTATION',
    resource_path: opts.path,
    metadata: { action: opts.action, ...opts.metadata },
  })
}
