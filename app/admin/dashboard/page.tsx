import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Users, Calendar, CheckCircle, ClipboardList,
         UserCheck, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = createClient()

  const [
    { count: totalProfiles },
    { count: totalEvents },
    { count: activeEvents },
    { count: totalRegistrations },
    { count: totalAttendance },
    { count: suspendedUsers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true })
      .in('status', ['upcoming', 'ongoing']),
    supabase.from('registrations').select('*', { count: 'exact', head: true }),
    supabase.from('registrations').select('*', { count: 'exact', head: true })
      .eq('checked_in', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .eq('role', 'deleted'),
  ])

  const attendanceRate = totalRegistrations
    ? Math.round(((totalAttendance || 0) / totalRegistrations) * 100)
    : 0

  const stats = [
    {
      label: 'Total Users',
      value: totalProfiles || 0,
      icon: Users,
      sub: `${suspendedUsers || 0} suspended`,
    },
    {
      label: 'Total Events',
      value: totalEvents || 0,
      icon: Calendar,
      sub: `${activeEvents || 0} active`,
    },
    {
      label: 'Registrations',
      value: totalRegistrations || 0,
      icon: ClipboardList,
      sub: `across all events`,
    },
    {
      label: 'Attendance',
      value: totalAttendance || 0,
      icon: UserCheck,
      sub: `${attendanceRate}% check-in rate`,
    },
    {
      label: 'Active Events',
      value: activeEvents || 0,
      icon: CheckCircle,
      sub: `upcoming + ongoing`,
    },
    {
      label: 'System Status',
      value: 'Operational',
      icon: ShieldCheck,
      sub: 'All systems normal',
      green: true,
    },
  ]

  return (
    <div className="w-full">
      <h1 className="text-3xl font-black tracking-tight mb-2 text-[#0a0a0a]">
        Admin Centre
      </h1>
      <p className="font-mono text-sm text-[#555555] mb-10">
        System Overview & Management
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono text-[#999] uppercase tracking-wider">
                  {stat.label}
                </p>
                <Icon
                  size={16}
                  className={stat.green ? 'text-green-500' : 'text-[#999]'}
                />
              </div>
              <p className={`text-3xl font-black font-mono leading-none
                ${stat.green ? 'text-green-600 text-xl' : 'text-[#0a0a0a]'}`}>
                {stat.value}
              </p>
              <p className="text-xs font-mono text-[#999]">{stat.sub}</p>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-bold mb-6 text-[#0a0a0a]">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            href: '/admin/users',
            title: 'Manage Users →',
            desc: 'Promote, demote, or suspend platform accounts.',
          },
          {
            href: '/admin/attendance',
            title: 'Attendance Portal →',
            desc: 'View attendee list and issue manual check-in overrides.',
          },
          {
            href: '/admin/events',
            title: 'All Events →',
            desc: 'Browse and manage every event on the platform.',
          },
          {
            href: '/admin/scanner',
            title: 'QR Scanner →',
            desc: 'Scan student tickets to mark attendance in real time.',
          },
          {
            href: '/admin/backup',
            title: 'System Backup →',
            desc: 'Download a full ZIP snapshot of all platform data.',
          },
        ].map(action => (
          <Link key={action.href} href={action.href}>
            <Card className="p-5 hover:border-[#0a0a0a] transition-colors cursor-pointer group h-full">
              <h3 className="font-bold mb-1.5 group-hover:underline text-sm">
                {action.title}
              </h3>
              <p className="text-xs font-mono text-[#555555] leading-relaxed">
                {action.desc}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
