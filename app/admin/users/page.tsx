import { createClient } from '@/lib/supabase/server'
import { UserTable } from '@/components/admin/UserTable'
import { UserExportMenu } from '@/components/admin/UserExportMenu'
import { CreateUserModal } from '@/components/admin/CreateUserModal'

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams?: { query?: string }
}) {
  const supabase = createClient()
  const query = searchParams?.query || ''

  let dbQuery = supabase
    .from('profiles')
    .select('*')

  if (query) {
    dbQuery = dbQuery.or(`full_name.ilike.%${query}%,usn.ilike.%${query}%`)
  }

  const { data: profiles } = await dbQuery

  return (
    <div className="w-full pb-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 text-[#0a0a0a]">Manage Users</h1>
          <p className="font-mono text-sm text-[#555555]">Promote, demote, or suspend platform accounts</p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-3 z-10 relative">
          <CreateUserModal />
          <UserExportMenu users={profiles || []} />
        </div>
      </div>

      <UserTable users={profiles || []} />
    </div>
  )
}
