import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.BREVO_API_KEY || ''

  try {
    const res = await fetch('https://api.brevo.com/v3/senders', {
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
      },
    })

    const data = await res.json()

    if (!res.ok) {
      console.warn('[Brevo Senders API Warning]:', data)
      return NextResponse.json({
        senders: [
          { name: 'One Percent Club', email: 'help@clubeve.nivet2006.in' },
          { name: 'One Percent Club (Certificates)', email: 'certificates@onepercentclub.nivet2006.in' },
          { name: 'Club Eve', email: 'info@clubeve.nivet2006.in' },
        ],
        error: data.message || 'Failed to fetch Brevo senders',
      })
    }

    const senders = (data.senders || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      active: s.active,
    }))

    return NextResponse.json({ success: true, senders })
  } catch (err: any) {
    console.error('[Brevo Senders API Error]:', err)
    return NextResponse.json({
      senders: [
        { name: 'One Percent Club', email: 'certificates@onepercentclub.nivet2006.in' },
        { name: 'Club Eve', email: 'info@clubeve.nivet2006.in' },
      ],
      error: err.message,
    })
  }
}
