import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface DispatchRequest {
  certificates: Array<{
    certificate_id: string
    name: string
    email: string
    event?: string
    public_url?: string | null
  }>
  dryRun?: boolean
  delaySeconds?: number
  senderEmail?: string
  senderName?: string
  templateHtml?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Admin Authentication Check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 })
    }

    const body = (await request.json()) as DispatchRequest
    const { certificates, dryRun = true, delaySeconds = 0.5, senderEmail = 'help@clubeve.nivet2006.in', senderName = 'One Percent Club', templateHtml } = body

    if (!Array.isArray(certificates) || certificates.length === 0) {
      return NextResponse.json({ error: 'No certificate records provided to dispatch.' }, { status: 400 })
    }

    // 2. Duplicate Active Job Check
    const { data: activeJobs } = await supabase
      .from('email_jobs')
      .select('id, status, created_at')
      .in('status', ['queued', 'starting', 'running'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (activeJobs && activeJobs.length > 0) {
      return NextResponse.json({
        error: 'An email job is already running or queued.',
        activeJobId: activeJobs[0].id
      }, { status: 409 })
    }

    // 3. Create email_jobs master record in Supabase
    const { data: job, error: jobError } = await supabase
      .from('email_jobs')
      .insert({
        status: 'queued',
        total_count: certificates.length,
        processed_count: 0,
        success_count: 0,
        failed_count: 0,
        dry_run: dryRun,
        delay_seconds: delaySeconds,
        sender_email: senderEmail,
        sender_name: senderName,
        template_html: templateHtml,
        created_by: user.id
      })
      .select()
      .single()

    if (jobError || !job) {
      console.error('[Job Create Error]:', jobError)
      return NextResponse.json({ error: jobError?.message || 'Failed to create email job record.' }, { status: 500 })
    }

    // 4. Create email_job_items child records for granular tracking & idempotency
    const jobItems = certificates.map((cert) => ({
      job_id: job.id,
      certificate_id: cert.certificate_id,
      recipient_name: cert.name,
      recipient_email: cert.email,
      event_name: cert.event || 'One Percent Club',
      public_url: cert.public_url || null,
      status: 'pending'
    }))

    const { error: itemsError } = await supabase.from('email_job_items').insert(jobItems)
    if (itemsError) {
      console.error('[Job Items Create Error]:', itemsError)
      // Rollback job state to failed
      await supabase.from('email_jobs').update({ status: 'failed', last_error: itemsError.message }).eq('id', job.id)
      return NextResponse.json({ error: 'Failed to populate job recipients.' }, { status: 500 })
    }

    // 5. Initial Log Entry
    await supabase.rpc('append_job_log', {
      p_job_id: job.id,
      p_level: 'info',
      p_message: `Created email job for ${certificates.length} certificates (Dry Run: ${dryRun})`
    })

    // 6. Dispatch GitHub Actions Workflow via GitHub REST API
    const githubToken = process.env.GITHUB_TOKEN
    const repoOwner = 'Nivet2006'
    const repoName = 'curdrice'
    const workflowId = 'certificate-emailer.yml'

    if (!githubToken) {
      await supabase.from('email_jobs').update({
        status: 'failed',
        last_error: 'GITHUB_TOKEN is missing in server environment.'
      }).eq('id', job.id)

      return NextResponse.json({
        error: 'GITHUB_TOKEN is missing in server environment. Cannot dispatch GitHub workflow.'
      }, { status: 500 })
    }

    const ghRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowId}/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${githubToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          job_id: job.id,
          live_run: dryRun ? 'false' : 'true',
          delay: String(delaySeconds)
        }
      })
    })

    if (!ghRes.ok) {
      const ghErrText = await ghRes.text()
      console.error('[GitHub Dispatch Error]:', ghRes.status, ghErrText)

      await supabase.from('email_jobs').update({
        status: 'failed',
        last_error: `GitHub Dispatch Failed (${ghRes.status}): ${ghErrText}`
      }).eq('id', job.id)

      return NextResponse.json({
        error: `Failed to trigger GitHub Actions workflow (${ghRes.status}).`
      }, { status: 502 })
    }

    // Update job state to 'starting'
    await supabase.from('email_jobs').update({ status: 'starting' }).eq('id', job.id)
    await supabase.rpc('append_job_log', {
      p_job_id: job.id,
      p_level: 'info',
      p_message: 'GitHub Actions workflow triggered successfully. Waiting for runner execution...'
    })

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Email job created and GitHub Action workflow dispatched successfully.'
    })

  } catch (err: any) {
    console.error('[Dispatch Endpoint Error]:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
