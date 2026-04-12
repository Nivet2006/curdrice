export type Role = 'student' | 'manager' | 'admin' | 'deleted'

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled'

export interface Profile {
  id: string
  full_name: string
  usn: string
  department: string
  semester: number
  year: number
  role: Role
  created_at: string
  username: string | null
  profile_edited: boolean
}

export interface Event {
  id: string
  title: string
  description: string | null
  club_name: string
  location: string | null
  event_date: string
  registration_deadline: string | null
  max_capacity: number | null
  status: EventStatus
  banner_url: string | null
  created_by: string
  created_at: string
}

export interface EventConstraint {
  id: string
  event_id: string
  allowed_semesters: number[] | null
  allowed_years: number[] | null
  allowed_departments: string[] | null
  created_at: string
}

export interface Registration {
  id: string
  event_id: string
  student_id: string
  qr_token: string
  checked_in: boolean
  checked_in_at: string | null
  registered_at: string
}

export interface BackupLog {
  id: string
  performed_by: string
  backup_type: string
  file_name: string
  row_counts: Record<string, number>
  created_at: string
}

export type ConversationType = 'dm' | 'group'
export type InviteStatus = 'pending' | 'accepted' | 'declined'
export type MemberRole = 'member' | 'admin'

export interface Conversation {
  id: string
  type: ConversationType
  name: string | null
  created_by: string
  created_at: string
  status: 'pending' | 'active'
}

export interface ConversationMember {
  id: string
  conversation_id: string
  account_id: string
  role: MemberRole
  joined_at: string
  invite_status: InviteStatus
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  is_archived: boolean
  is_deleted: boolean
}

export type NotificationType = 'event_registration' | 'dm_invite' | 'group_invite' | 'broadcast' | 'system'

export interface Notification {
  id: string
  account_id: string
  type: NotificationType
  title: string
  body: string | null
  metadata: any
  is_read: boolean
  is_archived: boolean
  created_at: string
}

export interface Broadcast {
  id: string
  sender_id: string
  subject: string
  body: string
  sent_at: string
}