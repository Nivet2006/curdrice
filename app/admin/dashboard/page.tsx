import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Users, Database, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = createClient()
  
  // Basic stats
  const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true })

  return (
    <div className="w-full">
      <h1 className="text-3xl font-black tracking-tight mb-2 text-[#0a0a0a]">Admin Centre</h1>
      <p className="font-mono text-sm text-[#555555] mb-12">System Overview & Management</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0a0a0a]">Total Profiles</h3>
            <Users className="text-[#999999]" size={20} />
          </div>
          <p className="text-4xl font-black font-mono">{usersCount || 0}</p>
        </Card>
        
        <Card className="p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0a0a0a]">Active Events</h3>
            <Database className="text-[#999999]" size={20} />
          </div>
          <p className="text-4xl font-black font-mono">{eventsCount || 0}</p>
        </Card>

        <Card className="p-6 flex flex-col justify-between">
           <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#eb4b4b]">System Status</h3>
            <ShieldAlert className="text-[#eb4b4b]" size={20} />
          </div>
          <p className="text-md font-mono text-[#eb4b4b]">All Systems Operational</p>
        </Card>
      </div>

      <h2 className="text-xl font-bold mb-6 text-[#0a0a0a]">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/users">
          <Card className="p-6 hover:border-[#0a0a0a] transition-colors cursor-pointer group">
            <h3 className="font-bold mb-2 group-hover:underline">Manage Users →</h3>
            <p className="text-xs font-mono text-[#555555]">Promote, demote, or suspend user accounts across the platform.</p>
          </Card>
        </Link>
        
        <Link href="/admin/backup">
          <Card className="p-6 hover:border-[#0a0a0a] transition-colors cursor-pointer group">
            <h3 className="font-bold mb-2 group-hover:underline">System Backup →</h3>
            <p className="text-xs font-mono text-[#555555]">Generate and download a full site-wide ZIP archive of all events and profiles.</p>
          </Card>
        </Link>
      </div>
    </div>
  )
}
