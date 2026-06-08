export type Role = 'student' | 'manager' | 'admin' | 'cc' | 'pr' | 'teacher' | 'hod' | 'deleted'

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
export type ApprovalStatus = 'draft' | 'pending_teacher' | 'pending_hod' | 'approved' | 'rejected'

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
  has_backlog: boolean
  year_back: boolean
}

export type ProfileUpdateStatus = 'pending' | 'approved' | 'rejected'

export type ThreadMode = 'open' | 'announcement' | 'moderated'

export interface ProfileUpdateRequest {
  id: string
  student_id: string
  field: string
  current_value: string | null
  new_value: string
  status: ProfileUpdateStatus
  feedback: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  profiles?: {
    full_name: string
    usn: string
    department: string
    semester: number
    year: number
  }
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
  approval_status: ApprovalStatus
  rejection_data: { field: string; reason: string }[]
  feedback_config: any[]
  feedback_open: boolean
  targeted_department: string | null
  banner_url: string | null
  is_public: boolean
  discussion_enabled: boolean
  thread_mode: ThreadMode
  waitlist_max?: number | null
  created_by: string
  created_at: string
}

export interface Report {
  id: string
  event_id: string
  content: any
  status: 'draft' | 'pending_pr' | 'completed'
  created_at: string
  updated_at: string
}

export interface ReportMarkup {
  id: string
  report_id: string
  author_id: string
  section_key: string
  comment: string
  resolved_at: string | null
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
  is_waitlisted?: boolean
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
  event_id: string | null
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
  reply_to_id: string | null
  created_at: string
  is_archived: boolean
  is_deleted: boolean
  is_pinned?: boolean
  sender?: { full_name: string; usn?: string; role?: Role }
  reply_to?: { body: string; sender?: { full_name: string } } | null
  reactions?: MessageReaction[]
}

export interface MessageReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
}

export type NotificationType = 'event_registration' | 'dm_invite' | 'group_invite' | 'broadcast' | 'system' | 'thread_mention'

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