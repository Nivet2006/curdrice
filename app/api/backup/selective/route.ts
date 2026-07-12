import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'


export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 })

    const body = await req.json()
    const { selections, purge, totpCode } = body as { selections: string[]; purge: boolean; totpCode?: string }

    if (!selections || !Array.isArray(selections) || selections.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'No items selected' }), { status: 400 })
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    if (purge) {
      if (!totpCode) return new NextResponse(JSON.stringify({ error: 'TOTP required for purge' }), { status: 400 })
      
      const { data: adminProfile } = await supabaseAdmin.from('profiles').select('totp_secret, totp_enabled').eq('id', user.id).single()
      if (!adminProfile?.totp_enabled || !adminProfile?.totp_secret) {
        return new NextResponse(JSON.stringify({ error: '2FA not enabled' }), { status: 400 })
      }

      const { verify } = await import('otplib')
      const result = await verify({ token: totpCode, secret: adminProfile.totp_secret })
      if (!result || (typeof result === 'object' && !result.valid)) {
        return new NextResponse(JSON.stringify({ error: 'Invalid verification code' }), { status: 400 })
      }
    }

    const zip = new JSZip()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 15)
    const filename = `Club-Eve_selective_${purge ? 'purge_' : ''}${timestamp}.zip`

    const addToZip = (data: unknown[], name: string) => {
      if (!data || data.length === 0) return
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31))
      const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })
      zip.file(`${name}.xlsx`, b64, { base64: true })
    }

    const purgeQueue: Array<() => Promise<void>> = []

    for (const item of selections) {
      const { data } = await supabaseAdmin.from(item).select('*')
      if (data && data.length > 0) {
        addToZip(data, item)
        if (purge && item !== 'profiles') {
          purgeQueue.push(async () => {
            const pk = data[0].id !== undefined ? 'id' : Object.keys(data[0])[0]
            const allIds = data.map((d: any) => d[pk])
            for (let i = 0; i < allIds.length; i += 100) {
              const chunk = allIds.slice(i, i + 100)
              await supabaseAdmin.from(item).delete().in(pk, chunk)
            }
          })
        }
      }
    }

    zip.file('backup_readme.txt', `Club-Eve Selective Backup\nGenerated: ${new Date().toISOString()}\nExported by Admin: ${user.id}\nPurged from DB: ${purge ? 'Yes' : 'No'}\nItems: ${selections.join(', ')}`)

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })

    if (purge) {
      for (const purgeAction of purgeQueue) {
        await purgeAction()
      }
    }

    // Record audit
    await supabaseAdmin.from('backup_logs').insert({
      admin_id: user.id,
      file_name: filename,
      backup_type: 'Selective',
      is_purged: purge,
      selections: selections
    })

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/zip',
      },
    })
  } catch (error: any) {
    console.error('Selective Backup Error:', error)
    return new NextResponse(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 })
  }
}
