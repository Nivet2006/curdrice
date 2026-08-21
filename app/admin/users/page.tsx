import { createClient } from '@/lib/supabase/server'
import { UserTable } from '@/components/admin/UserTable'
import { UserExportMenu } from '@/components/admin/UserExportMenu'
import { CreateUserModal } from '@/components/admin/CreateUserModal'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<{ query?: string }>
}) {
  const supabase = await createClient()
  const { query = '' } = await searchParams

  let dbQuery = supabase
    .from('profiles')
    .select('id, full_name, usn, department, semester, year, role, created_at')

  if (query) {
    dbQuery = dbQuery.or(`full_name.ilike.%${query}%,usn.ilike.%${query}%`)
  }

  const { data: profiles } = await dbQuery
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <div className="w-full pb-16 space-y-6">
      <AdminPageHeader
        breadcrumbs={[{ label: 'People' }, { label: 'Users' }]}
        title="Manage Users"
        subtitle={`Total ${profiles?.length || 0} user accounts. Promote, demote, or suspend platform accounts.`}
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <CreateUserModal />
            <UserExportMenu users={(profiles || []) as any[]} />
          </div>
        }
      />

      <UserTable users={(profiles || []) as any} />
    </div>
  )
}
