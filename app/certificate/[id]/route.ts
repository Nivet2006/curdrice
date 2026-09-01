import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  if (!id) {
    return new NextResponse('Certificate ID is required', { status: 400 })
  }

  // 1. Look up certificate by certificate_id or id in database
  const { data: cert, error } = await supabaseAdmin
    .from('certificates')
    .select('*')
    .or(`certificate_id.eq.${id},id.eq.${id}`)
    .maybeSingle()

  if (error || !cert) {
    return new NextResponse('Certificate not found', { status: 404 })
  }

  if (!cert.file_path && !cert.public_url) {
    return new NextResponse('Certificate file has not been uploaded yet', { status: 404 })
  }

  // 2. Fetch file content from Supabase Storage
  let pdfBuffer: ArrayBuffer | null = null
  let mimeType = 'application/pdf'

  if (cert.file_path) {
    const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
      .from('certificates')
      .download(cert.file_path)

    if (!downloadError && fileBlob) {
      pdfBuffer = await fileBlob.arrayBuffer()
    }
  }

  // Fallback to fetching public_url if direct storage download was empty
  if (!pdfBuffer && cert.public_url) {
    try {
      const res = await fetch(cert.public_url)
      if (res.ok) {
        pdfBuffer = await res.arrayBuffer()
      }
    } catch (_) {
      // ignore fallback failure
    }
  }

  if (!pdfBuffer) {
    // If streaming failed but public_url exists, redirect to public_url
    if (cert.public_url) {
      return NextResponse.redirect(cert.public_url)
    }
    return new NextResponse('Failed to load certificate file from storage', { status: 500 })
  }

  const safeFilename = `${cert.certificate_id || 'certificate'}.pdf`

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${safeFilename}"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
