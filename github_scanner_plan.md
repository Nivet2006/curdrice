# Implementation Plan: The Ultimate GitHub Scanner Suite

This document details the architectural design and implementation plan for the **Ultimate GitHub Scanner** suite to validate hackathon submissions, detect plagiarism, scan security leaks, analyze work equity, and visualize project structure.

---

## 🏛️ Architectural Overview

We will introduce a dedicated backend service to handle all GitHub-related requests, parsing, and analysis. To ensure fast, zero-budget, and API-rate-limit-friendly execution:
1. **GitHub Public API**: Used primarily to fetch repository metadata, languages, contents, and commits.
2. **Raw File Service (`raw.githubusercontent.com`)**: Used to fetch text contents directly (e.g., `README.md`, `package.json`, or main source files) without consuming REST API rate limits.
3. **Local Text Similarity Algorithms**: Run natively in Next.js Server Actions using tokenization, TF-IDF representations, and Jaro-Winkler/Cosine similarity metrics.

---

## Proposed Components & Code Structure

### 1. Backend Service
#### [NEW] [github-scanner.ts](file:///c:/codingprojects/Curdrice/lib/services/github-scanner.ts)
A singleton service containing helper functions:
- `verifyRepo(owner: string, repo: string)`: Calls GitHub API to check if the repository is public and active.
- `fetchCommitTimeline(owner: string, repo: string, eventStart: Date, eventEnd: Date)`: Retrieves commits and counts additions/deletions mapped by timestamp.
- `scanForSecrets(rawText: string)`: Scans strings with Regex patterns for common secret keys (AWS, Supabase, database connection URIs, Firebase config, Discord tokens, Slack Webhooks).
- `computeJaroWinkler(str1: string, str2: string)`: Measures string similarity.
- `parseArchitecture(repoStructure: any[])`: Scans file paths to identify stack categories (e.g., matching files containing `/app` or `/pages` for Next.js, `requirements.txt` for Python, `schema.prisma` for Prisma, etc.).

---

### 2. Database Schema Extensions
#### [NEW] [0042_github_scanner_data.sql](file:///c:/codingprojects/Curdrice/supabase/migrations/0042_github_scanner_data.sql)
We will add columns to cache the scanned GitHub metadata in `hackathon_submissions`:
```sql
ALTER TABLE hackathon_submissions 
ADD COLUMN IF NOT EXISTS git_scan_status text DEFAULT 'pending', -- 'pending', 'completed', 'failed'
ADD COLUMN IF NOT EXISTS git_commit_velocity jsonb,            -- Cached timeline data
ADD COLUMN IF NOT EXISTS git_work_distribution jsonb,          -- Contributor percentages
ADD COLUMN IF NOT EXISTS git_architecture jsonb,               -- Auto-mapped tech stack/Mermaid diagram nodes
ADD COLUMN IF NOT EXISTS git_security_warnings jsonb,          -- Array of detected secret leaks
ADD COLUMN IF NOT EXISTS git_plagiarism_index double precision DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS git_readme_content text;               -- Cached markdown of README.md
```

---

### 3. Feature Breakdown & Logic Design

#### Feature 1: Git Commit Velocity & Heatmap (Pre-built Code Detector)
- **Data Collection**: Fetch repository commits: `GET /repos/{owner}/{repo}/commits?since={eventStart}&until={eventEnd}`.
- **Analysis**:
  - Map commits by time interval.
  - Calculate commit increments. If there is only one commit at the beginning of the hackathon with massive line additions (>5000 lines), set `prebuilt_flag = true`.
- **UI Representation**: Render a mini line chart or contribution grid showing hour-by-hour commit density during the event.

#### Feature 2: Cross-Submission Plagiarism Detector
- **Data Collection**: On submission close, CCs/Admins trigger plagiarism scan. Fetch primary code files (e.g., `.ts`, `.tsx`, `.py`, `.js`) from all active submissions.
- **Similarity Math**:
  - Run a lightweight TF-IDF tokenizer on the code files to strip comments/whitespace.
  - Compute Cosine similarity on the token profiles.
  - Set a plagiarism score between `0.0` and `1.0`. Any match above `0.7` flags a warning showing which two teams have matching structures.

#### Feature 3: Secret & Security Scanner
- **Data Collection**: Fetch raw configurations (`.env.example`, main configs, database loaders).
- **Matching**: Run a set of strict regular expressions:
  - AWS Access Key: `AKIA[0-9A-Z]{16}`
  - Supabase Service Role / Anon: `eyJhbGciOi...`
  - Generic DB URI: `postgresql://...` or `mongodb+srv://...`
- **UI Alert**: If any secret matches, display a banner inside the student submission portal:
  - 🚨 *Warning: Credentials detected in public files. Revoke immediately to secure your accounts.*

#### Feature 4: Auto-Generated System Architecture Mapper
- **Logic**: Fetch file tree `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1`.
- **Mapping rules**:
  - If `package.json` contains `next`: add node `Frontend (Next.js)`.
  - If `requirements.txt` contains `fastapi`: add node `Backend (FastAPI)`.
  - If file names contain `schema.prisma` or `supabase`: add node `Database`.
- **Diagram Render**: Generate a simple Mermaid diagram string to render inside the project showcase modal:
  ```mermaid
  graph LR
    Frontend(Next.js) --> Backend(FastAPI)
    Backend --> Database(Supabase)
  ```

#### Feature 5: Interactive README Hub
- **Logic**: Fetch README using `raw.githubusercontent.com/{owner}/{repo}/main/README.md`.
- **Caching**: Store raw markdown in the database.
- **Render**: Inside the showcase page, render using a styled `<ReactMarkdown>` container with tailwind styling overrides to look premium and native to Club-Eve.

#### Feature 6: Contributor Work-Distribution Audit
- **Logic**: Query `/repos/{owner}/{repo}/stats/contributors`.
- **Equity Audit**: Extract total commits and line additions per author profile. Map the percentages (e.g., `Author A: 75%`, `Author B: 25%`).
- **Feedback**: If inequality exceeds a threshold (e.g., one student has >90% code contributions on a team of 4), display a balanced workload warning to judges.

---

## 🧪 Verification Plan
1. **Mock GitHub Responses**: Write test cases mapping mock API structures to verify regex security matches, Git velocity calculations, and Mermaid diagram output formatting.
2. **Rate Limit Audits**: Test caching to verify that repeat page views fetch scanned Git data from the Supabase database instead of hitting the GitHub API repeatedly.
