import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('teamId')

  if (!teamId) {
    return NextResponse.json({ error: 'teamId required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: submission, error } = await supabase
    .from('hackathon_submissions')
    .select('*')
    .eq('team_id', teamId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ submission })
}
