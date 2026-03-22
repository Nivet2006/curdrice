

export type Role = 'student' | 'manager' | 'admin' | 'deleted'

export interface Profile {
  id: string
  full_name: string
  usn: string
  department: string
  semester: number
  year: number
  role: Role
  created_at: string
}

export type EventStatus = 'upcoming' | 'ongoing' | 'completed'

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
