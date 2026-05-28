import { NextResponse } from 'next/server'
import { getPendingProfileRequests } from '@/lib/actions/profile-requests'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dept = searchParams.get('dept') || ''

  if (!dept) {
    return NextResponse.json({ error: 'dept parameter is required' }, { status: 400 })
  }

  const res = await getPendingProfileRequests(dept)
  if (res.error) {
    return NextResponse.json({ error: res.error }, { status: 401 })
  }

  return NextResponse.json({ data: res.data })
}
