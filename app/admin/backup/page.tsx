import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Card } from '@/components/ui/Card'
import { DownloadCloud, Archive, History } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

import { SelectiveBackupCard } from '@/components/admin/SelectiveBackupCard'

export const dynamic = 'force-dynamic'

export default async function BackupPage() {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' })
      }
    }
  )

  const { data: rawLogs } = await supabaseAdmin
    .from('backup_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  // Fix: column is admin_id not performed_by
  const adminIds = (rawLogs || []).map((l: { admin_id: string }) => l.admin_id)

  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name')
    .in('id', adminIds.length ? adminIds : ['00000000-0000-0000-0000-000000000000'])

  const logs = (rawLogs || []).map((log: { 
    id: string; 
    admin_id: string; 
    created_at: string; 
    file_name: string;
    backup_type: string;
    is_purged: boolean;
    selections: string[];
  }) => ({
    ...log,
    profiles: profiles?.find(p => p.id === log.admin_id) || { full_name: 'Unknown Admin' }
  }))

  // Fetch tables dynamically
  let availableTables: string[] = []
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    const res = await fetch(url, { cache: 'no-store' })
    const openapiData = await res.json()
    availableTables = Object.keys(openapiData.paths)
      .filter(p => p !== '/' && !p.includes('{') && !p.startsWith('/rpc/'))
      .map(p => p.slice(1))
  } catch (error) {
    console.error('Failed to fetch openapi spec', error)
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-2 text-[#0a0a0a]">System Backup</h1>
        <p className="font-mono text-sm text-[#555555]">Securely archive database state to a standalone snapshot.</p>
      </div>
      
      <Card className="p-8 mb-6 flex flex-col md:flex-row items-center justify-between gap-6 border-[#0a0a0a] border-2 bg-[#f9f9f9]">
        <div className="flex items-start gap-4">
          <Archive size={40} className="text-[#0a0a0a]" />
          <div>
            <h3 className="text-lg font-bold">Generate Absolute Backup</h3>
            <p className="text-xs font-mono text-[#555555] max-w-[600px] mt-2 leading-relaxed">
              Generates an instant ZIP containing standardized Excel (.xlsx) snapshots of all system tables, complete audit logs from the separate logging database, and all contents of the iic-reports bucket. The action is recorded in the immutable audit log below.
            </p>
          </div>
        </div>
        <form action="/api/backup" method="GET">
           <Button type="submit" variant="primary" className="bg-[#0a0a0a] flex items-center gap-2 whitespace-nowrap px-6 py-3">
             <DownloadCloud size={16} /> Download .zip
           </Button>
        </form>
      </Card>

      <SelectiveBackupCard availableTables={availableTables} />

      <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><History size={20}/> Audit Log</h2>
      <div className="border border-[#e0e0e0] rounded-2xl overflow-hidden bg-white shadow-sm">
        <table className="w-full text-left font-sans text-sm">
          <thead className="bg-[#f5f5f5] text-[#555555] font-mono text-xs uppercase tracking-widest border-b border-[#e0e0e0]">
            <tr>
              <th className="px-6 py-4 font-normal">Timestamp</th>
              <th className="px-6 py-4 font-normal">Admin</th>
              <th className="px-6 py-4 font-normal">Type</th>
              <th className="px-6 py-4 font-normal">Details</th>
              <th className="px-6 py-4 font-normal">Filename (Hash)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0e0e0]">
            {(logs || []).map((log) => (
              <tr key={log.id} className="hover:bg-[#fafafa]">
                <td className="px-6 py-4 font-mono text-xs text-[#555555]">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-bold text-[#0a0a0a]">
                  {(log.profiles as { full_name: string }).full_name}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {log.backup_type === 'Absolute' ? (
                      <Badge className="bg-[#0a0a0a] text-white hover:bg-[#222]">Absolute</Badge>
                    ) : (
                      <Badge className="bg-[#555] text-white hover:bg-[#777]">Selective</Badge>
                    )}
                    {log.is_purged && <Badge className="bg-[#eb4b4b] text-white hover:bg-[#d43838]">Purged</Badge>}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs">
                  {log.backup_type === 'Absolute' ? (
                    <span className="text-[#555]">Full System Export</span>
                  ) : (
                    <span className="font-mono text-[#555] block w-48 truncate" title={(log.selections || []).join(', ')}>
                      {(log.selections || []).join(', ')}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-[#999999]">
                  {log.file_name}
                </td>
              </tr>
            ))}
            {(!logs || logs.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center font-mono text-sm text-[#999999]">
                  No backups have been generated yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
