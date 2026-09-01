export interface EmailTemplateParams {
  name: string
  email: string
  certificateId: string
  eventName: string
  certificateUrl: string
}

/**
 * Generates a clean, copyable plain-text email ready for direct sending.
 */
export function generatePlainTextEmail(params: EmailTemplateParams): { subject: string; body: string; fullText: string } {
  const event = params.eventName || 'One Percent Club'
  const subject = `Your Certificate of Participation — ${event}`
  const body = `Hi ${params.name},

Thank you for being a part of ${event}.

We truly appreciate your participation and enthusiasm. We’re pleased to share your certificate with you.

Your Certificate:
${params.certificateUrl}

Thank you for being a part of the journey.

${event}
Gopalan College of Engineering and Management

---
Powered by Club Eve`

  const fullText = `Subject: ${subject}\n\n${body}`

  return { subject, body, fullText }
}

/**
 * Generates a polished HTML email template compatible with Brevo and major email clients (Gmail, Outlook, Apple Mail).
 * Uses table layouts and inline CSS to ensure bulletproof rendering.
 */
export function generateBrevoHtmlEmail(params: EmailTemplateParams): string {
  const event = params.eventName || 'One Percent Club'
  const logoUrl = 'https://onepercentclub.nivet2006.in/nobgonepercent.png'
  const clubEveLogoUrl = 'https://clubeve.nivet2006.in/logo.png'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${event} Certificate</title>
</head>
<body style="margin:0; padding:0; background:#f5f5f3; font-family:Arial,Helvetica,sans-serif; color:#171717;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f3;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background:#ffffff;">
          <!-- Main Logo -->
          <tr>
            <td align="center" style="padding:42px 32px 28px;">
              <img
                src="${logoUrl}"
                alt="${event}"
                width="220"
                style="display:block; width:220px; max-width:80%; height:auto; border:0;"
              >
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px; background:#e8e8e8;"></div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:42px 48px 20px;">
              <p style="margin:0 0 20px; font-size:16px; line-height:26px;">
                Hi ${params.name},
              </p>

              <p style="margin:0 0 18px; font-size:16px; line-height:26px;">
                Thank you for being a part of
                <strong>${event}</strong>.
              </p>

              <p style="margin:0 0 28px; font-size:16px; line-height:26px; color:#555555;">
                We truly appreciate your participation and enthusiasm.
                Your certificate is now ready to view.
              </p>

              <!-- Certificate CTA -->
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 32px;">
                <tr>
                  <td align="center" style="background:#111111;">
                    <a
                      href="${params.certificateUrl}"
                      target="_blank"
                      style="
                        display:inline-block;
                        padding:15px 30px;
                        font-size:13px;
                        font-weight:bold;
                        letter-spacing:1px;
                        color:#ffffff;
                        text-decoration:none;
                      "
                    >
                      VIEW MY CERTIFICATE
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px; font-size:13px; line-height:21px; color:#777777;">
                If the button doesn't work, copy and open this link:
              </p>

              <p style="margin:0 0 32px; font-size:13px; line-height:21px; word-break:break-all;">
                <a
                  href="${params.certificateUrl}"
                  target="_blank"
                  style="color:#111111; text-decoration:underline;"
                >
                  ${params.certificateUrl}
                </a>
              </p>

              <p style="margin:0 0 6px; font-size:15px; line-height:24px;">
                Thank you for being part of the journey.
              </p>

              <p style="margin:0; font-size:15px; line-height:24px; font-weight:bold;">
                ${event}
              </p>

              <p style="margin:3px 0 0; font-size:13px; line-height:21px; color:#777777;">
                Gopalan College of Engineering and Management
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:30px 40px 36px;">
              <div style="height:1px; background:#eeeeee; margin-bottom:24px;"></div>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    <span style="font-size:11px; color:#999999;">
                      POWERED BY
                    </span>
                    <br>
                    <img
                      src="${clubEveLogoUrl}"
                      alt="Club Eve"
                      width="75"
                      style="display:block; width:75px; height:auto; margin-top:6px; border:0;"
                    >
                  </td>

                  <td align="right" valign="middle">
                    <span style="font-size:11px; color:#aaaaaa;">
                      ${event}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Legal / Fallback -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">
          <tr>
            <td align="center" style="padding:20px 20px 0;">
              <p style="margin:0; font-size:11px; line-height:18px; color:#999999;">
                This email was sent regarding your participation in ${event}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Generates a Brevo / Mailchimp compatible CSV string containing certificate links for all uploaded participants.
 */
export function generateEmailExportCsv(
  items: Array<{ name: string; email: string; certificate_id: string; public_url?: string | null }>
): string {
  const headers = ['name', 'email', 'certificate_id', 'certificate_url']
  const rows = items.map((item) => {
    const certUrl = item.public_url || ''
    // Escape double quotes in fields
    return [
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.email.replace(/"/g, '""')}"`,
      `"${item.certificate_id.replace(/"/g, '""')}"`,
      `"${certUrl.replace(/"/g, '""')}"`,
    ].join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

/**
 * Generates a single concatenated document containing all plain text emails for every uploaded certificate.
 */
export function generateAllEmailsCombinedText(
  items: Array<{ name: string; email: string; certificate_id: string; event?: string; public_url?: string | null }>,
  defaultEventName: string = 'One Percent Club'
): string {
  if (items.length === 0) return 'No uploaded certificates found.'

  return items
    .map((item, index) => {
      const eventName = item.event || defaultEventName
      const certUrl = item.public_url || `https://club-eve.com/certificate/${item.certificate_id}`
      const emailObj = generatePlainTextEmail({
        name: item.name,
        email: item.email,
        certificateId: item.certificate_id,
        eventName,
        certificateUrl: certUrl,
      })

      return `===================================================================
RECORD #${index + 1} — ${item.name} (${item.email})
CERTIFICATE ID: ${item.certificate_id}
===================================================================
${emailObj.fullText}`
    })
    .join('\n\n\n')
}

