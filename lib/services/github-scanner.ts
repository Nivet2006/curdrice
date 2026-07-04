import { createClient } from '@/lib/supabase/server'

// Helper to parse repo owner and name from URL
export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  try {
    const cleanUrl = url.trim().replace(/\/$/, '')
    const match = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/i)
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\.git$/i, '') }
    }
  } catch (e) {}
  return null
}

// GitHub API Headers helper
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Curdrice-GitHub-Scanner',
  }
  const token = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN
  if (token) {
    headers['Authorization'] = `token ${token}`
  }
  return headers
}

// 1. Verify Repository
export async function verifyRepo(owner: string, repo: string): Promise<{ success: boolean; defaultBranch?: string; error?: string }> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: getHeaders(),
    })
    if (!res.ok) {
      if (res.status === 404) return { success: false, error: 'Repository not found or is private.' }
      return { success: false, error: `GitHub API error: ${res.statusText}` }
    }
    const data = await res.json()
    return { success: true, defaultBranch: data.default_branch || 'main' }
  } catch (e: any) {
    return { success: false, error: e.message || 'Unknown network error' }
  }
}

// 2. Fetch Commit Timeline and check for prebuilt flags
export async function fetchCommitTimeline(
  owner: string,
  repo: string,
  eventStart?: Date,
  eventEnd?: Date
): Promise<{
  timeline: { date: string; count: number }[]
  prebuiltFlag: boolean
  totalCommits: number
  error?: string
}> {
  try {
    let url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`
    if (eventStart) url += `&since=${eventStart.toISOString()}`
    if (eventEnd) url += `&until=${eventEnd.toISOString()}`

    const res = await fetch(url, { headers: getHeaders() })
    if (!res.ok) {
      return { timeline: [], prebuiltFlag: false, totalCommits: 0, error: res.statusText }
    }

    const commits = await res.json()
    if (!Array.isArray(commits)) {
      return { timeline: [], prebuiltFlag: false, totalCommits: 0 }
    }

    // Map commits by date
    const dateMap: { [key: string]: number } = {}
    commits.forEach((c: any) => {
      try {
        const dateStr = new Date(c.commit?.author?.date).toISOString().split('T')[0]
        dateMap[dateStr] = (dateMap[dateStr] || 0) + 1
      } catch (e) {}
    })

    const timeline = Object.entries(dateMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Prebuilt code detection:
    // If there are very few commits (e.g. 1 or 2) but they contain massive changes.
    // Let's check detail of the first commit if there is only 1 commit.
    let prebuiltFlag = false
    if (commits.length === 1) {
      const sha = commits[0].sha
      const detailRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}`, {
        headers: getHeaders(),
      })
      if (detailRes.ok) {
        const detail = await detailRes.json()
        const additions = detail.stats?.additions || 0
        if (additions > 5000) {
          prebuiltFlag = true
        }
      }
    }

    return {
      timeline,
      prebuiltFlag,
      totalCommits: commits.length,
    }
  } catch (e: any) {
    return { timeline: [], prebuiltFlag: false, totalCommits: 0, error: e.message }
  }
}

// 3. Scan strings for common secrets/keys
export function scanForSecrets(rawText: string): string[] {
  const warnings: string[] = []
  const rules = [
    { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/g },
    { name: 'Supabase Token / JWT', regex: /eyJhbGciOi[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g },
    { name: 'Database Connection URI (Postgres/Mongo)', regex: /(postgresql|mongodb\+srv):\/\/[a-zA-Z0-9_]+:[a-zA-Z0-9_%@\-]+@[a-zA-Z0-9.\-_]+(:\d+)?\/[a-zA-Z0-9_\-\.]*/g },
    { name: 'Discord Bot Token', regex: /[MN][a-zA-Z0-9_\-]{23,25}\.[a-zA-Z0-9_\-]{6}\.[a-zA-Z0-9_\-]{27,39}/g },
    { name: 'Slack Webhook URL', regex: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9_]+\/B[A-Z0-9_]+\/[A-Za-z0-9_]+/g },
    { name: 'Generic API Key / Secret', regex: /(api_key|client_secret|private_key|secret_key|db_password)\s*[:=]\s*['"`][a-zA-Z0-9_\-]{16,}['"`]/gi }
  ]

  rules.forEach((rule) => {
    const matches = rawText.match(rule.regex)
    if (matches && matches.length > 0) {
      warnings.push(`Detected potential ${rule.name}`)
    }
  })

  return warnings
}

// 4. Jaro-Winkler distance calculation
export function computeJaroWinkler(str1: string, str2: string): number {
  let s1 = str1.trim().toLowerCase()
  let s2 = str2.trim().toLowerCase()

  if (s1 === s2) return 1.0
  if (s1.length === 0 || s2.length === 0) return 0.0

  const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1
  const s1Matches = new Array(s1.length).fill(false)
  const s2Matches = new Array(s2.length).fill(false)

  let matches = 0
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchWindow)
    const end = Math.min(s2.length - 1, i + matchWindow)

    for (let j = start; j <= end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true
        s2Matches[j] = true
        matches++
        break
      }
    }
  }

  if (matches === 0) return 0.0

  // Transpositions
  let transpositions = 0
  let k = 0
  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++
      if (s1[i] !== s2[k]) transpositions++
      k++
    }
  }

  const jaro = (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3.0

  // Winkler modifications
  const prefixLimit = 4
  let prefix = 0
  for (let i = 0; i < Math.min(prefixLimit, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefix++
    else break
  }

  return jaro + prefix * 0.1 * (1.0 - jaro)
}

// Cosine Similarity helper for plagiarism
export function computeCosineSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().match(/\w+/g) || []
  const words2 = text2.toLowerCase().match(/\w+/g) || []

  if (words1.length === 0 || words2.length === 0) return 0

  const freq1: { [key: string]: number } = {}
  const freq2: { [key: string]: number } = {}

  words1.forEach(w => freq1[w] = (freq1[w] || 0) + 1)
  words2.forEach(w => freq2[w] = (freq2[w] || 0) + 1)

  const allWords = new Set([...Object.keys(freq1), ...Object.keys(freq2)])

  let dotProduct = 0
  let mag1 = 0
  let mag2 = 0

  allWords.forEach(w => {
    const f1 = freq1[w] || 0
    const f2 = freq2[w] || 0
    dotProduct += f1 * f2
    mag1 += f1 * f1
    mag2 += f2 * f2
  })

  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2))
}

// 5. Parse Architecture
export function parseArchitecture(filePaths: string[], packageJsonContent?: any, requirementsContent?: string): {
  frontend: string
  backend: string
  database: string
  diagram: string
} {
  let frontend = 'Unknown'
  let backend = 'Unknown'
  let database = 'Unknown'

  // Analyze package.json if present
  if (packageJsonContent) {
    const deps = { ...packageJsonContent.dependencies, ...packageJsonContent.devDependencies }
    if (deps['next']) frontend = 'Next.js'
    else if (deps['react']) frontend = 'React'
    else if (deps['vue']) frontend = 'Vue'
    else if (deps['nuxt']) frontend = 'Nuxt'
    else if (deps['svelte']) frontend = 'Svelte'

    if (deps['express']) backend = 'Express (Node.js)'
    else if (deps['nest']) backend = 'NestJS (Node.js)'
    else if (deps['fastify']) backend = 'Fastify (Node.js)'
  }

  // Analyze requirements.txt / Python files if present
  if (requirementsContent) {
    const reqs = requirementsContent.toLowerCase()
    if (reqs.includes('fastapi')) backend = 'FastAPI (Python)'
    else if (reqs.includes('flask')) backend = 'Flask (Python)'
    else if (reqs.includes('django')) backend = 'Django (Python)'
  }

  // Fallback to path heuristics
  filePaths.forEach(p => {
    const pl = p.toLowerCase()
    if (pl.includes('requirements.txt') && backend === 'Unknown') {
      backend = 'Python Backend'
    }
    if (pl.includes('schema.prisma') && database === 'Unknown') {
      database = 'Prisma (SQL)'
    }
    if ((pl.includes('supabase') || pl.includes('supabase.js') || pl.includes('supabase/migrations')) && database === 'Unknown') {
      database = 'Supabase'
    }
    if ((pl.includes('firebase') || pl.includes('firebase.js')) && database === 'Unknown') {
      database = 'Firebase'
    }
  })

  // Set default values if still unknown
  if (frontend === 'Unknown' && filePaths.some(p => p.match(/\.(tsx|jsx|ts|js)$/))) {
    frontend = 'Web Application'
  }

  const diagram = `graph LR\n  Frontend(${frontend}) --> Backend(${backend})\n  Backend --> Database(${database})`

  return { frontend, backend, database, diagram }
}

// 6. Contributor stats helper
export async function fetchContributorStats(owner: string, repo: string): Promise<{
  distribution: { author: string; percentage: number; commits: number }[]
  error?: string
}> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/stats/contributors`, {
      headers: getHeaders(),
    })
    
    // GitHub returns 202 if stats are compiling. We should return an empty list or error
    if (res.status === 202) {
      return { distribution: [], error: 'GitHub stats are compiling. Try again in a few seconds.' }
    }
    if (!res.ok) {
      return { distribution: [], error: res.statusText }
    }

    const data = await res.json()
    if (!Array.isArray(data)) {
      return { distribution: [] }
    }

    let totalCommits = 0
    const contribs = data.map((item: any) => {
      const author = item.author?.login || 'Unknown'
      const commits = item.total || 0
      totalCommits += commits
      return { author, commits }
    })

    const distribution = contribs.map((c) => ({
      author: c.author,
      commits: c.commits,
      percentage: totalCommits > 0 ? Math.round((c.commits / totalCommits) * 100) : 0,
    })).sort((a, b) => b.commits - a.commits)

    return { distribution }
  } catch (e: any) {
    return { distribution: [], error: e.message }
  }
}

// 7. Full scan orchestrator
export async function runFullGitScan(submissionId: string) {
  const supabase = await createClient()

  // Get submission details
  const { data: sub, error: subError } = await supabase
    .from('hackathon_submissions')
    .select('*, event:events(event_date)')
    .eq('id', submissionId)
    .single()

  if (subError || !sub) {
    console.error('Submission not found for scanning:', subError)
    return { error: 'Submission not found' }
  }

  const repoUrl = sub.repo_url
  if (!repoUrl) {
    await supabase.from('hackathon_submissions').update({
      git_scan_status: 'failed',
    }).eq('id', submissionId)
    return { error: 'No repository URL provided' }
  }

  const parsed = parseRepoUrl(repoUrl)
  if (!parsed) {
    await supabase.from('hackathon_submissions').update({
      git_scan_status: 'failed',
    }).eq('id', submissionId)
    return { error: 'Invalid GitHub repository URL' }
  }

  const { owner, repo } = parsed

  // Set to pending
  await supabase.from('hackathon_submissions').update({
    git_scan_status: 'pending',
  }).eq('id', submissionId)

  try {
    // A. Verify & default branch
    const verifyResult = await verifyRepo(owner, repo)
    if (!verifyResult.success) {
      await supabase.from('hackathon_submissions').update({
        git_scan_status: 'failed',
      }).eq('id', submissionId)
      return { error: verifyResult.error }
    }

    const branch = verifyResult.defaultBranch || 'main'

    // B. Fetch tree for architecture & secrets configuration
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
      headers: getHeaders(),
    })

    let filePaths: string[] = []
    let packageJsonContent: any = null
    let requirementsContent: string = ''
    let readmeContent: string = ''
    const securityWarnings: string[] = []

    if (treeRes.ok) {
      const treeData = await treeRes.json()
      if (treeData.tree && Array.isArray(treeData.tree)) {
        filePaths = treeData.tree.map((f: any) => f.path)

        // Fetch package.json, requirements.txt, and README
        const pkgFile = treeData.tree.find((f: any) => f.path.toLowerCase().endsWith('package.json'))
        const reqsFile = treeData.tree.find((f: any) => f.path.toLowerCase().endsWith('requirements.txt'))
        const readmeFile = treeData.tree.find((f: any) => f.path.toLowerCase().endsWith('readme.md'))

        // Use raw content service to fetch files to avoid REST API rate limits
        if (pkgFile) {
          try {
            const rawPkg = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${pkgFile.path}`)
            if (rawPkg.ok) packageJsonContent = await rawPkg.json()
          } catch (e) {}
        }

        if (reqsFile) {
          try {
            const rawReqs = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${reqsFile.path}`)
            if (rawReqs.ok) requirementsContent = await rawReqs.text()
          } catch (e) {}
        }

        if (readmeFile) {
          try {
            const rawReadme = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${readmeFile.path}`)
            if (rawReadme.ok) readmeContent = await rawReadme.text()
          } catch (e) {}
        }

        // Scan some main configuration/env files for secrets
        const configFiles = treeData.tree.filter((f: any) => {
          const lowerPath = f.path.toLowerCase()
          return lowerPath.includes('env') || lowerPath.includes('config') || lowerPath.endsWith('.ts') || lowerPath.endsWith('.js')
        }).slice(0, 10) // Limit to top 10 files

        for (const file of configFiles) {
          try {
            const rawFileRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`)
            if (rawFileRes.ok) {
              const fileText = await rawFileRes.text()
              const secrets = scanForSecrets(fileText)
              secrets.forEach((s) => {
                const warningMsg = `${s} in file: ${file.path}`
                if (!securityWarnings.includes(warningMsg)) {
                  securityWarnings.push(warningMsg)
                }
              })
            }
          } catch (e) {}
        }
      }
    }

    // C. Commit Timeline & prebuilt code flag
    const eventDate = sub.event?.event_date ? new Date(sub.event.event_date) : undefined
    // If event_date is defined, let's look at commits from 24h before to 48h after, or just general window
    const eventStart = eventDate ? new Date(eventDate.getTime() - 24 * 60 * 60 * 1000) : undefined
    const eventEnd = eventDate ? new Date(eventDate.getTime() + 48 * 60 * 60 * 1000) : undefined

    const timelineResult = await fetchCommitTimeline(owner, repo, eventStart, eventEnd)

    // D. Contributor Work Distribution
    const statsResult = await fetchContributorStats(owner, repo)

    // E. Parse Tech Stack
    const archResult = parseArchitecture(filePaths, packageJsonContent, requirementsContent)

    // F. Save to Database
    const { error: updateError } = await supabase
      .from('hackathon_submissions')
      .update({
        git_scan_status: 'completed',
        git_commit_velocity: {
          timeline: timelineResult.timeline,
          prebuiltFlag: timelineResult.prebuiltFlag,
          totalCommits: timelineResult.totalCommits
        },
        git_work_distribution: statsResult.distribution,
        git_architecture: archResult,
        git_security_warnings: securityWarnings,
        git_readme_content: readmeContent || 'No README.md found in public repository.',
      })
      .eq('id', submissionId)

    if (updateError) throw updateError

    return { success: true }
  } catch (e: any) {
    await supabase.from('hackathon_submissions').update({
      git_scan_status: 'failed',
    }).eq('id', submissionId)
    return { error: e.message || 'Error occurred during Git scan' }
  }
}
