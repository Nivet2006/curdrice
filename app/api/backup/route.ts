import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import { logsClient } from '@/lib/supabase/logs-client'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new NextResponse('Forbidden', { status: 403 })

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const zip = new JSZip()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 15)
  const filename = `Club-Eve_backup_${timestamp}.zip`

  const addToZip = (data: unknown[], name: string) => {
    if (!data || data.length === 0) return
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31)) // Sheet names max 31 chars
    const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })
    zip.file(`${name}.xlsx`, b64, { base64: true })
  }

  // 1. Fetch all tables from Main DB
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.SUPABASE_SERVICE_ROLE_KEY}`
  const openapiRes = await fetch(url)
  const openapiData = await openapiRes.json()
  const tables = Object.keys(openapiData.paths)
    .filter(p => p !== '/' && !p.includes('{') && !p.startsWith('/rpc/'))
    .map(p => p.slice(1))

  await Promise.all(tables.map(async (table) => {
    const { data } = await supabaseAdmin.from(table).select('*')
    addToZip(data || [], table)
  }))

  // 2. Fetch Audit Logs from Logs DB
  const { data: auditLogs } = await logsClient.from('audit_logs').select('*')
  addToZip(auditLogs || [], 'audit_logs')

  // 3. Backup iic-reports bucket from Logs DB
  const { data: rootItems } = await logsClient.storage.from('iic-reports').list()
  if (rootItems && rootItems.length > 0) {
    const bucketFolder = zip.folder('iic-reports')
    await Promise.all(rootItems.map(async (rootItem) => {
      if (rootItem.id === null) {
        const { data: subItems } = await logsClient.storage.from('iic-reports').list(rootItem.name)
        if (subItems) {
          for (const subItem of subItems) {
            if (subItem.id !== null) {
              const filePath = `${rootItem.name}/${subItem.name}`
              const { data: fileData } = await logsClient.storage.from('iic-reports').download(filePath)
              if (fileData) {
                const buffer = await fileData.arrayBuffer()
                bucketFolder?.file(filePath, buffer)
              }
            }
          }
        }
      } else {
        const { data: fileData } = await logsClient.storage.from('iic-reports').download(rootItem.name)
        if (fileData) {
          const buffer = await fileData.arrayBuffer()
          bucketFolder?.file(rootItem.name, buffer)
        }
      }
    }))
  }

  zip.file('backup_readme.txt', `Club-Eve Absolute Backup Database Snapshot\nGenerated: ${new Date().toISOString()}\nExported by Admin: ${user.id}`)

  const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })

  // Record audit
  await supabaseAdmin.from('backup_logs').insert({
    admin_id: user.id,
    file_name: filename,
    backup_type: 'Absolute',
    is_purged: false,
    selections: ['all_tables', 'audit_logs', 'bucket:iic-reports']
  })

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'application/zip',
    },
  })
}
