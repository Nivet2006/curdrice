// Certificate Email HTML Template
export function getEmailTemplate(studentName: string, eventName: string, dateStr: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e5e5e5; border-radius: 24px; background-color: #ffffff;">
      <div style="margin-bottom: 24px;">
        <span style="font-family: monospace; font-size: 12px; letter-spacing: 0.15em; color: #a1a1aa; font-weight: 700; text-transform: uppercase;">
          |||··|| EventHub Certify
        </span>
      </div>
      
      <h2 style="color: #09090b; font-size: 24px; font-weight: 800; tracking: -0.025em; margin: 0 0 16px 0; text-transform: uppercase;">
        Congratulations, ${studentName}!
      </h2>
      
      <p style="color: #4b5563; font-size: 14px; line-height: 20px; margin: 0 0 24px 0;">
        We are thrilled to present your official certificate of participation/achievement for <strong>${eventName}</strong>${dateStr ? ` held on ${dateStr}` : ''}.
      </p>
      
      <div style="margin: 32px 0; padding: 20px; background-color: #f4f4f5; border-radius: 16px; border: 1px solid #e4e4e7;">
        <p style="margin: 0; font-size: 11px; font-family: monospace; color: #71717a; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">
          Attachment Details
        </p>
        <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: bold; color: #18181b;">
          ${eventName.replace(/\s+/g, '_')}_Certificate.pdf
        </p>
      </div>
      
      <p style="color: #71717a; font-size: 12px; line-height: 18px; margin: 0 0 16px 0;">
        You can also download and view all your earned certificates at any time by logging into your student dashboard.
      </p>
      
      <div style="border-t: 1px solid #e5e5e5; padding-top: 16px; margin-top: 32px;">
        <p style="margin: 0; font-size: 10px; color: #a1a1aa; font-family: monospace; text-align: center;">
          GCEM Club-Event Management System • Secure Automated Certificate Delivery
        </p>
      </div>
    </div>
  `;
}
