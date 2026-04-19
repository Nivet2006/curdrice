import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'

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

  const [
    { data: profiles },
    { data: events },
    { data: registrations },
    { data: constraints }
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*'),
    supabaseAdmin.from('events').select('*'),
    supabaseAdmin.from('registrations').select('*'),
    supabaseAdmin.from('event_constraints').select('*')
  ])

  const zip = new JSZip()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 15)
  const filename = `Club-Eve_backup_${timestamp}.zip`

  const addToZip = (data: unknown[], name: string) => {
    if (!data || data.length === 0) return
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, name)
    const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })
    zip.file(`${name}.xlsx`, b64, { base64: true })
  }

  addToZip(profiles || [], 'profiles')
  addToZip(events || [], 'events')
  addToZip(registrations || [], 'registrations')
  addToZip(constraints || [], 'constraints')

  zip.file('backup_readme.txt', `Club-Eve Absolute Backup Database Snapshot\nGenerated: ${new Date().toISOString()}\nExported by Admin: ${user.id}`)

  const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })

  // Record audit
  await supabaseAdmin.from('backup_logs').insert({
    admin_id: user.id,
    file_name: filename
  })

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'application/zip',
    },
  })
}
