import { NextRequest, NextResponse } from 'next/server'
import { generateBrevoHtmlEmail } from '@/lib/templates/email-templates'

interface RecipientItem {
  certificate_id: string
  name: string
  email: string
  event?: string
  public_url?: string | null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const recipients = (body.recipients || []) as RecipientItem[]
    const defaultEvent = body.event || 'One Percent Club'
    const customSenderEmail = body.senderEmail || 'certificates@onepercentclub.nivet2006.in'
    const customSenderName = body.senderName || defaultEvent
    const customTemplate = body.templateHtml || body.customTemplate || null

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Recipients array is required and must not be empty.' }, { status: 400 })
    }

    const apiKey = process.env.BREVO_API_KEY || process.env.RESEND_API_KEY
    const isMock = !apiKey

    const results = []

    for (const item of recipients) {
      const eventName = item.event || defaultEvent
      const origin = request.nextUrl.origin || 'https://club-eve.nivet2006.in'
      const certUrl = item.public_url || `${origin}/certificate/${encodeURIComponent(item.certificate_id)}`
      
      let htmlContent = ''
      if (customTemplate && typeof customTemplate === 'string' && customTemplate.trim().length > 0) {
        htmlContent = customTemplate
          .replace(/\{\{\s*name\s*\}\}/gi, item.name)
          .replace(/\{\{\s*certificate_url\s*\}\}/gi, certUrl)
          .replace(/\{\{\s*certificate_id\s*\}\}/gi, item.certificate_id)
          .replace(/\{\{\s*event\s*\}\}/gi, eventName)
      } else {
        htmlContent = generateBrevoHtmlEmail({
          name: item.name,
          email: item.email,
          certificateId: item.certificate_id,
          eventName,
          certificateUrl: certUrl,
        })
      }

      const subject = `Your Certificate of Participation — ${eventName}`

      if (isMock) {
        // Simulate sending delay for demo
        await new Promise((resolve) => setTimeout(resolve, 150))
        results.push({
          certificate_id: item.certificate_id,
          name: item.name,
          email: item.email,
          status: 'success',
          mode: 'mock',
          sender: `${customSenderName} <${customSenderEmail}>`,
          messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          timestamp: new Date().toISOString(),
        })
      } else {
        try {
          const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': apiKey,
            },
            body: JSON.stringify({
              sender: {
                name: customSenderName,
                email: customSenderEmail,
              },
              to: [{ email: item.email, name: item.name }],
              subject: subject,
              htmlContent: htmlContent,
            }),
          })

          const data = await res.json()

          if (res.ok) {
            results.push({
              certificate_id: item.certificate_id,
              name: item.name,
              email: item.email,
              status: 'success',
              mode: 'brevo_live',
              messageId: data.messageId || data.id,
              timestamp: new Date().toISOString(),
            })
          } else {
            let errMsg = data.message || 'Brevo API error'
            if (errMsg.includes('unrecognised IP address')) {
              const ipMatch = errMsg.match(/IP address\s+([a-f0-9:.]+)/i)
              const clientIp = ipMatch ? ipMatch[1] : ''
              errMsg = `Brevo IP Block: Add IP (${clientIp}) to https://app.brevo.com/security/authorised_ips or disable IP Whitelisting in Brevo settings.`
            }

            results.push({
              certificate_id: item.certificate_id,
              name: item.name,
              email: item.email,
              status: 'failed',
              error: errMsg,
              timestamp: new Date().toISOString(),
            })
          }
        } catch (err: any) {
          results.push({
            certificate_id: item.certificate_id,
            name: item.name,
            email: item.email,
            status: 'failed',
            error: err.message || 'Network request failed',
            timestamp: new Date().toISOString(),
          })
        }
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length
    const failedCount = results.filter((r) => r.status === 'failed').length

    return NextResponse.json({
      success: true,
      mode: isMock ? 'mock' : 'live',
      stats: { total: recipients.length, success: successCount, failed: failedCount },
      results,
    })
  } catch (err: any) {
    console.error('[Cert Email Batch Error]:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
