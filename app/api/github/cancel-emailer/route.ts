import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate Admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 })
    }

    const { jobId } = await request.json()
    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required.' }, { status: 400 })
    }

    // Check existing job
    const { data: job } = await supabase
      .from('email_jobs')
      .select('id, status')
      .eq('id', jobId)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 })
    }

    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
      return NextResponse.json({ message: 'Job is already finished.', job })
    }

    // Update status to cancelled
    const { data: updatedJob, error: updateError } = await supabase
      .from('email_jobs')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        last_heartbeat_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    await supabase.rpc('append_job_log', {
      p_job_id: jobId,
      p_level: 'warning',
      p_message: 'Job cancelled by admin via web dashboard.'
    })

    return NextResponse.json({
      success: true,
      message: 'Job cancellation request issued successfully.',
      job: updatedJob
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
