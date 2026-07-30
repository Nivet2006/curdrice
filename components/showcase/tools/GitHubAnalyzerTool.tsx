'use client'

import React, { useState } from 'react'
import { Github, Code2, Star, GitFork, BookOpen, ExternalLink, RefreshCw, Trophy } from 'lucide-react'

export function GitHubAnalyzerTool() {
  const [username, setUsername] = useState('Nivet2006')
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!username.trim()) return
    setLoading(true)
    setError(null)

    try {
      // Fetch User details
      const userRes = await fetch(`https://api.github.com/users/${username.trim()}`)
      if (!userRes.ok) {
        throw new Error('GitHub profile not found or API rate limit exceeded.')
      }
      const user = await userRes.json()

      // Fetch Repositories
      const reposRes = await fetch(`https://api.github.com/users/${username.trim()}/repos?per_page=30&sort=updated`)
      const repos = reposRes.ok ? await reposRes.json() : []

      let totalStars = 0
      let totalForks = 0
      const langCount: Record<string, number> = {}

      if (Array.isArray(repos)) {
        repos.forEach((repo: any) => {
          totalStars += repo.stargazers_count || 0
          totalForks += repo.forks_count || 0
          if (repo.language) {
            langCount[repo.language] = (langCount[repo.language] || 0) + 1
          }
        })
      }

      const languages = Object.entries(langCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)

      // Developer Rank Score logic
      const repoScore = Math.min(40, (user.public_repos || 0) * 2)
      const starScore = Math.min(30, totalStars * 5)
      const followerScore = Math.min(30, (user.followers || 0) * 3)
      const totalDevScore = Math.min(100, repoScore + starScore + followerScore + 20)

      let rankTier = 'B-Tier Developer'
      if (totalDevScore >= 80) rankTier = 'S-Tier Developer (Elite)'
      else if (totalDevScore >= 60) rankTier = 'A-Tier Developer (Strong)'

      setProfileData({
        user,
        repos: repos.slice(0, 4),
        totalStars,
        totalForks,
        languages,
        totalDevScore,
        rankTier
      })
    } catch (err: any) {
      setError(err.message || 'Failed to fetch GitHub statistics.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 font-mono text-zinc-900 dark:text-white">
      {/* Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-black rounded-xl font-bold shrink-0">
            <Github size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase font-mono">GitHub Profile &amp; Coding Matrix Analyzer</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Analyze developer commit velocity, top technology stack distribution, and open-source rating.
            </p>
          </div>
        </div>
      </div>

      {/* Input Field */}
      <div className="flex gap-3">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter GitHub username (e.g. torvalds)..."
          className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-mono outline-none focus:border-amber-500"
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !username.trim()}
          className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase text-xs rounded-2xl shadow-lg shrink-0 flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Code2 size={14} />}
          {loading ? 'Analyzing...' : 'Analyze GitHub'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* Results View */}
      {profileData && (
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-6 text-white animate-in fade-in duration-300">
          {/* Top User Card */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-4">
              <img
                src={profileData.user.avatar_url}
                alt={profileData.user.login}
                className="w-14 h-14 rounded-2xl border border-zinc-700 object-cover"
              />
              <div>
                <h4 className="text-lg font-bold font-mono uppercase">{profileData.user.name || profileData.user.login}</h4>
                <p className="text-xs font-mono text-zinc-400">@{profileData.user.login}</p>
                {profileData.user.bio && (
                  <p className="text-xs font-mono text-zinc-400 mt-1 line-clamp-1">{profileData.user.bio}</p>
                )}
              </div>
            </div>

            <a
              href={profileData.user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-mono font-bold uppercase flex items-center gap-1.5"
            >
              GitHub Profile <ExternalLink size={12} />
            </a>
          </div>

          {/* Stats Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-center space-y-1">
              <span className="text-xs font-bold uppercase text-zinc-400">Public Repos</span>
              <p className="text-2xl font-black text-white">{profileData.user.public_repos}</p>
            </div>
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-center space-y-1">
              <span className="text-xs font-bold uppercase text-zinc-400">Stars Earned</span>
              <p className="text-2xl font-black text-amber-400">{profileData.totalStars}</p>
            </div>
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-center space-y-1">
              <span className="text-xs font-bold uppercase text-zinc-400">Forks</span>
              <p className="text-2xl font-black text-blue-400">{profileData.totalForks}</p>
            </div>
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-center space-y-1">
              <span className="text-xs font-bold uppercase text-zinc-400">Followers</span>
              <p className="text-2xl font-black text-emerald-400">{profileData.user.followers}</p>
            </div>
          </div>

          {/* Languages & Rank Tier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-3">
              <h5 className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
                <Code2 size={14} /> Top Stack Languages
              </h5>
              <div className="space-y-2">
                {profileData.languages.map(([lang, count]: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-300 font-bold">{lang}</span>
                    <span className="text-zinc-500">{count} Repos</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-3 flex flex-col justify-between">
              <div>
                <h5 className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
                  <Trophy size={14} /> Developer Rank Score
                </h5>
                <p className="text-3xl font-black text-amber-400 pt-2">{profileData.totalDevScore} / 100</p>
                <p className="text-xs font-bold font-mono text-emerald-400 uppercase pt-1">{profileData.rankTier}</p>
              </div>
              <p className="text-[10px] text-zinc-500">
                Calculated based on repository output, stars, and open-source contributions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
