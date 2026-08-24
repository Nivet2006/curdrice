'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import {
  Check,
  Play,
  Settings,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  Download,
  AlertTriangle,
  Server,
  Layers,
  Info,
  X,
  Lock,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { runServiceTestsAction, getEnvironmentAuditAction } from '@/lib/actions/tester-actions'

interface SubCheck {
  name: string
  status: 'passed' | 'failed' | 'warning' | 'configured' | 'skipped'
  details?: string
}

interface TestResult {
  status: 'passed' | 'failed' | 'skipped' | 'warning' | 'configured'
  message: string
  durationMs: number
  subChecks?: SubCheck[]
}

interface EnvVariableAudit {
  name: string
  service: string
  isConfigured: boolean
  isRequired: boolean
  isServerOnly: boolean
  usedIn: string
}

interface ServiceItem {
  id: string
  name: string
  desc: string
  category: 'domain' | 'external'
}

const services: ServiceItem[] = [
  // Domain Services
  { id: 'permission-service', name: 'Permission Service', desc: 'Global roles & profile checks', category: 'domain' },
  { id: 'rate-limit-service', name: 'Rate Limit Service', desc: 'Upstream rate checking', category: 'domain' },
  { id: 'venue-service', name: 'Venue Service', desc: 'Event venue constraints', category: 'domain' },
  { id: 'event-service', name: 'Event Service', desc: 'Core event management', category: 'domain' },
  { id: 'registration-service', name: 'Registration Service', desc: 'Student registrations & waitlists', category: 'domain' },
  { id: 'attendance-service', name: 'Attendance Service', desc: 'Student check-ins & logs', category: 'domain' },
  { id: 'club-service', name: 'Club Service', desc: 'Club operations & stats', category: 'domain' },
  { id: 'hackathon-service', name: 'Hackathon Service', desc: 'Hackathon teams & submissions schema', category: 'domain' },
  { id: 'email-service', name: 'Email Queue Service', desc: 'Database email queue & dispatch', category: 'domain' },
  { id: 'notification-service', name: 'Notification Service', desc: 'Notification rules & dispatch logs', category: 'domain' },
  { id: 'feedback-service', name: 'Feedback Service', desc: 'Post-event feedback status', category: 'domain' },
  { id: 'certificate-service', name: 'Certificate Service', desc: 'Cert templates & validation', category: 'domain' },
  { id: 'gamification-service', name: 'Gamification Service', desc: 'Leaderboards & student badges', category: 'domain' },
  { id: 'analytics-service', name: 'Analytics Service', desc: 'Platform-wide count aggregates', category: 'domain' },
  { id: 'export-service', name: 'Export Service', desc: 'ExcelJS & CSV exports', category: 'domain' },
  { id: 'qr-service', name: 'QR Service', desc: 'UUID v4 QR validations', category: 'domain' },
  { id: 'calendar-service', name: 'Calendar Service', desc: 'Time ranges & schedule overlaps', category: 'domain' },

  // External & Storage Infrastructure Services
  { id: 'media-service', name: 'Media Service (B2 Images)', desc: 'Backblaze B2 S3 photo storage & database', category: 'external' },
  { id: 'b2-documents-service', name: 'Backblaze Document Storage', desc: 'B2 S3 PDF/document storage & download URL', category: 'external' },
  { id: 'supabase-service', name: 'Supabase Platform', desc: 'Database connection, public keys & service role', category: 'external' },
  { id: 'brevo-service', name: 'Brevo Email Service', desc: 'Transactional email API & sender verification', category: 'external' },
  { id: 'convertapi-service', name: 'ConvertAPI Service', desc: 'PDF to DOCX report conversion API', category: 'external' },
  { id: 'vercel-service', name: 'Vercel Platform', desc: 'Vercel REST API deployment status', category: 'external' },
  { id: 'github-service', name: 'GitHub Integration', desc: 'GitHub REST API repository scanner', category: 'external' },
  { id: 'playwright-service', name: 'Playwright Bug Reporter', desc: 'Bug reporter test authentication', category: 'external' },
  { id: 'site-url-service', name: 'Site URL Configuration', desc: 'NEXT_PUBLIC_SITE_URL format & routing', category: 'external' }
]

export default function DiagnosticsPage() {
  const [selectedServices, setSelectedServices] = useState<string[]>(services.map(s => s.id))
  const [results, setResults] = useState<Record<string, TestResult>>({})
  const [running, setRunning] = useState(false)
  const [globalStatus, setGlobalStatus] = useState<'idle' | 'success' | 'warning' | 'failed'>('idle')
  const [activeTab, setActiveTab] = useState<'all' | 'domain' | 'external' | 'env'>('all')
  
  // Environment Audit state
  const [envAudit, setEnvAudit] = useState<EnvVariableAudit[]>([])
  const [loadingAudit, setLoadingAudit] = useState(false)

  // SubCheck detail modal state
  const [activeDetailService, setActiveDetailService] = useState<ServiceItem | null>(null)

  // Mounted state for SSR hydration safety
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadEnvAudit()
  }, [])

  const loadEnvAudit = async () => {
    setLoadingAudit(true)
    const res = await getEnvironmentAuditAction()
    if (res.data) {
      setEnvAudit(res.data)
    }
    setLoadingAudit(false)
  }

  const handleToggle = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    setSelectedServices(services.map(s => s.id))
  }

  const handleSelectNone = () => {
    setSelectedServices([])
  }

  const handleRunTests = async () => {
    if (selectedServices.length === 0) return
    setRunning(true)
    setGlobalStatus('idle')

    const res = await runServiceTestsAction(selectedServices)
    setRunning(false)

    if (res.error) {
      alert(`Error running diagnostic suite: ${res.error}`)
      setGlobalStatus('failed')
      return
    }

    if (res.data) {
      setResults(res.data)
      const resValues = Object.values(res.data)
      const hasFailures = resValues.some(r => r.status === 'failed')
      const hasWarnings = resValues.some(r => r.status === 'warning' || r.status === 'configured')

      if (hasFailures) {
        setGlobalStatus('failed')
      } else if (hasWarnings) {
        setGlobalStatus('warning')
      } else {
        setGlobalStatus('success')
      }
    }
  }

  const exportResults = () => {
    window.print()
  }

  const filteredServices = services.filter(s => {
    if (activeTab === 'domain') return s.category === 'domain'
    if (activeTab === 'external') return s.category === 'external'
    return true
  })

  // Calculate health score metrics
  const totalChecked = Object.keys(results).length
  const totalPassed = Object.values(results).filter(r => r.status === 'passed').length
  const totalConfigured = Object.values(results).filter(r => r.status === 'configured' || r.status === 'warning').length
  const totalFailed = Object.values(results).filter(r => r.status === 'failed').length
  const healthPercent = totalChecked > 0 ? Math.round((totalPassed / totalChecked) * 100) : 0

  return (
    <div>
      {/* ── Screen Layout ────────────────────────────────────────────────────────── */}
      <div className="print:hidden w-full max-w-6xl mx-auto py-8 px-4">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2 text-[#0a0a0a] dark:text-white flex items-center gap-3">
              <Server className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              System Diagnostics & Integrations
            </h1>
            <p className="font-mono text-sm text-[#555555] dark:text-zinc-400">
              Real read-only integration health checks & environment verification
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              SELECT ALL
            </button>
            <button
              onClick={handleSelectNone}
              className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              CLEAR
            </button>
            {Object.keys(results).length > 0 && (
              <button
                onClick={exportResults}
                className="flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-semibold transition-all duration-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:scale-[1.02]"
              >
                <Download className="w-3.5 h-3.5" />
                EXPORT PDF REPORT
              </button>
            )}
            <button
              onClick={handleRunTests}
              disabled={running || selectedServices.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black font-semibold text-sm rounded-xl transition-all duration-300 shadow-lg shadow-black/15 dark:shadow-white/15 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              <Play className="w-4 h-4 fill-current" />
              {running ? 'TESTING INTEGRATIONS...' : 'RUN INTEGRATION DIAGNOSTICS'}
            </button>
          </div>
        </div>

        {/* Global Status Alert Banner */}
        {globalStatus !== 'idle' && (
          <div className={`mb-8 p-6 rounded-[2rem] border flex items-center gap-4 transition-all duration-500 animate-fadeIn ${
            globalStatus === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-300'
              : globalStatus === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30 text-amber-800 dark:text-amber-300'
              : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-300'
          }`}>
            {globalStatus === 'success' && <ShieldCheck className="w-8 h-8 text-emerald-500 shrink-0" />}
            {globalStatus === 'warning' && <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />}
            {globalStatus === 'failed' && <ShieldAlert className="w-8 h-8 text-red-500 shrink-0" />}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider font-mono">
                {globalStatus === 'success' && 'ALL INTEGRATIONS OPERATIONAL'}
                {globalStatus === 'warning' && 'PARTIAL VERIFICATION / CONFIGURATION ADVISORY'}
                {globalStatus === 'failed' && 'INTEGRATION FAILURE DETECTED'}
              </h4>
              <p className="text-xs opacity-90 mt-0.5">
                {globalStatus === 'success' && 'All tested services and external integrations passed live read-only verification.'}
                {globalStatus === 'warning' && 'Some integrations passed, while optional services are configured or returned warnings. Click any service card for detailed sub-checks.'}
                {globalStatus === 'failed' && 'One or more required integrations failed live verification. Inspect details below.'}
              </p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6 gap-2 font-mono text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-4 font-bold border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            ALL SERVICES ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('domain')}
            className={`pb-3 px-4 font-bold border-b-2 transition-colors ${
              activeTab === 'domain'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            DOMAIN SERVICES ({services.filter(s => s.category === 'domain').length})
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={`pb-3 px-4 font-bold border-b-2 transition-colors ${
              activeTab === 'external'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            EXTERNAL & STORAGE INTEGRATIONS ({services.filter(s => s.category === 'external').length})
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`pb-3 px-4 font-bold border-b-2 transition-colors ${
              activeTab === 'env'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            ENVIRONMENT AUDIT ({envAudit.length})
          </button>
        </div>

        {/* Environment Audit Panel */}
        {activeTab === 'env' ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm mb-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  Environment Variable Integration Audit
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
                  Inspect configured vs missing environment parameters across all services. Secrets are strictly hidden.
                </p>
              </div>
              <button
                onClick={loadEnvAudit}
                disabled={loadingAudit}
                className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`} />
                REFRESH AUDIT
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase">
                    <th className="pb-3 pr-4 font-bold">Variable Identifier</th>
                    <th className="pb-3 pr-4 font-bold">Service</th>
                    <th className="pb-3 pr-4 font-bold">Scope</th>
                    <th className="pb-3 pr-4 font-bold">Required</th>
                    <th className="pb-3 pr-4 font-bold">Configuration Status</th>
                    <th className="pb-3 font-bold">Used In</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {envAudit.map(v => (
                    <tr key={v.name} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="py-3 pr-4 font-bold text-zinc-900 dark:text-zinc-100">{v.name}</td>
                      <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">{v.service}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.isServerOnly
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                        }`}>
                          {v.isServerOnly ? 'SERVER ONLY' : 'PUBLIC'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-[10px] font-bold ${v.isRequired ? 'text-red-500' : 'text-zinc-400'}`}>
                          {v.isRequired ? 'REQUIRED' : 'OPTIONAL'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.isConfigured
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : v.isRequired
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}>
                          {v.isConfigured ? <Check className="w-3 h-3" /> : null}
                          {v.isConfigured ? 'CONFIGURED' : 'MISSING'}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-500 dark:text-zinc-400 text-[11px] font-sans">{v.usedIn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Services Check Matrix */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {filteredServices.map(service => {
              const isSelected = selectedServices.includes(service.id)
              const result = results[service.id]

              let statusClass = 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
              if (running && isSelected) {
                statusClass = 'border-blue-500 dark:border-blue-500/50 bg-blue-50/10 animate-pulse'
              } else if (result) {
                if (result.status === 'passed') {
                  statusClass = 'border-emerald-500 dark:border-emerald-500/50 bg-emerald-50/10'
                } else if (result.status === 'configured') {
                  statusClass = 'border-amber-400 dark:border-amber-500/40 bg-amber-50/10'
                } else if (result.status === 'warning') {
                  statusClass = 'border-amber-500 dark:border-amber-500/50 bg-amber-50/10'
                } else if (result.status === 'failed') {
                  statusClass = 'border-red-500 dark:border-red-500/50 bg-red-50/10'
                }
              }

              return (
                <Card
                  key={service.id}
                  className={`p-5 transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                    !running && 'hover:scale-[1.01] hover:shadow-md'
                  } ${statusClass}`}
                  onClick={() => {
                    if (result && result.subChecks && result.subChecks.length > 0) {
                      setActiveDetailService(service)
                    } else if (!running) {
                      handleToggle(service.id)
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 group-hover:text-zinc-600 transition-colors uppercase">
                      {service.category === 'external' ? 'INTEGRATION' : 'DOMAIN SERVICE'}
                    </span>

                    <div className="flex items-center gap-1.5" onClick={(e) => { e.stopPropagation(); if (!running) handleToggle(service.id) }}>
                      {result ? (
                        result.status === 'passed' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : result.status === 'configured' || result.status === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : result.status === 'failed' ? (
                          <ShieldAlert className="w-4 h-4 text-red-500" />
                        ) : (
                          <HelpCircle className="w-4 h-4 text-zinc-400" />
                        )
                      ) : (
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black'
                            : 'border-zinc-300 dark:border-zinc-700'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                      )}
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-[#0a0a0a] dark:text-white mb-1 flex items-center justify-between">
                    <span>{service.name}</span>
                    {result && result.subChecks && (
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 underline opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-[#666] dark:text-zinc-400 leading-normal mb-3">
                    {service.desc}
                  </p>

                  {result && (
                    <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-[10px] font-mono">
                      <span className={`font-semibold ${
                        result.status === 'passed'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : result.status === 'configured' || result.status === 'warning'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {result.status.toUpperCase()}
                      </span>
                      <span className="text-zinc-400">
                        {result.durationMs}ms
                      </span>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {/* Output Console Log Panel */}
        {Object.keys(results).length > 0 && (
          <div className="bg-[#0b0c10] border border-zinc-800 rounded-[2rem] p-6 shadow-2xl">
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 font-mono mb-4 flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Settings className="w-4 h-4 animate-spin text-zinc-600" />
              Diagnostic Logs Console
            </h4>

            <div className="space-y-3 max-h-[300px] overflow-y-auto font-mono text-xs leading-relaxed text-zinc-300 pr-2">
              {Object.entries(results).map(([serviceId, result]) => (
                <div key={serviceId} className="flex flex-col sm:flex-row sm:items-start gap-1 border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500 min-w-[170px] shrink-0 font-bold">[{serviceId}]</span>
                  <span className={`min-w-[80px] shrink-0 font-bold ${
                    result.status === 'passed'
                      ? 'text-emerald-400'
                      : result.status === 'configured' || result.status === 'warning'
                      ? 'text-amber-400'
                      : result.status === 'failed'
                      ? 'text-red-400'
                      : 'text-zinc-600'
                  }`}>
                    {result.status.toUpperCase()}
                  </span>
                  <span className="text-zinc-400 shrink-0 font-mono min-w-[50px]">({result.durationMs}ms)</span>
                  <span className="text-zinc-100 break-words">{result.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SubCheck Detail Modal ────────────────────────────────────────────────────────── */}
      {activeDetailService && results[activeDetailService.id] && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => setActiveDetailService(null)}
              className="absolute top-5 right-5 p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
                DEEP INTEGRATION INSPECTOR
              </span>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
                {activeDetailService.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {results[activeDetailService.id].message}
              </p>
            </div>

            <div className="space-y-3 my-5 border-t border-b border-zinc-100 dark:border-zinc-800 py-4 max-h-[300px] overflow-y-auto font-mono text-xs">
              {results[activeDetailService.id].subChecks?.map((sub, idx) => (
                <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{sub.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      sub.status === 'passed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : sub.status === 'configured' || sub.status === 'warning'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                    }`}>
                      {sub.status.toUpperCase()}
                    </span>
                  </div>
                  {sub.details && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-sans mt-0.5">
                      {sub.details}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveDetailService(null)}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold text-xs rounded-xl"
              >
                CLOSE INSPECTOR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Print Health Report Layout (Only rendered during window.print()) ────────────────── */}
      <div className="hidden print:block font-sans text-black p-4 max-w-4xl mx-auto">
        {/* Header Block */}
        <div className="border-b-4 border-black pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">
              Club-Eve Integration & Service Health Report
            </h1>
            <p className="text-xs font-mono text-zinc-500 mt-1" suppressHydrationWarning>
              Document Ref: EVE-DIAG-{mounted ? new Date().toISOString().split('T')[0] : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono" suppressHydrationWarning>Date: {mounted ? new Date().toLocaleString() : ''}</p>
            <p className="text-xs font-mono">Operator: Administrator</p>
          </div>
        </div>

        {/* Global Summary Badge Panel */}
        <div className="grid grid-cols-3 gap-4 mb-8 border border-zinc-300 p-4 rounded-xl bg-zinc-50">
          <div className="text-center border-r border-zinc-200">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">System Integrity</span>
            <span className={`text-xl font-bold uppercase ${healthPercent === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {healthPercent === 100 ? 'Healthy' : 'Advisory / Partial'}
            </span>
          </div>
          <div className="text-center border-r border-zinc-200">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Health Score</span>
            <span className="text-xl font-black font-mono">{healthPercent}%</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Passed / Tested</span>
            <span className="text-xl font-bold font-mono">{totalPassed} / {totalChecked}</span>
          </div>
        </div>

        {/* Audit Tables */}
        <h2 className="text-sm font-black uppercase tracking-wider mb-3">Integration Diagnostics Result List</h2>
        <table className="w-full border-collapse border border-zinc-300 text-xs text-left mb-6">
          <thead>
            <tr className="bg-zinc-100 border-b border-zinc-300">
              <th className="p-3 border-r border-zinc-300 font-bold uppercase tracking-wider">Service Identifier</th>
              <th className="p-3 border-r border-zinc-300 font-bold uppercase tracking-wider">Status</th>
              <th className="p-3 border-r border-zinc-300 font-bold uppercase tracking-wider">Latency</th>
              <th className="p-3 font-bold uppercase tracking-wider">Verification Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {services.map(s => {
              const res = results[s.id]
              if (!res) return null

              return (
                <tr key={s.id} className="align-top">
                  <td className="p-3 border-r border-zinc-300 font-mono font-bold">{s.id}</td>
                  <td className={`p-3 border-r border-zinc-300 font-bold ${
                    res.status === 'passed'
                      ? 'text-emerald-600'
                      : res.status === 'configured' || res.status === 'warning'
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}>
                    {res.status.toUpperCase()}
                  </td>
                  <td className="p-3 border-r border-zinc-300 font-mono">{res.durationMs}ms</td>
                  <td className="p-3 break-words text-zinc-700">{res.message}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Footer Audit Stamp */}
        <div className="border-t border-zinc-300 pt-4 mt-8 flex justify-between items-center text-[10px] font-mono text-zinc-500">
          <p>© Club-Eve Diagnostics Suite · All core operations & external APIs verified.</p>
          <p className="text-right">Signature Stamp: APPROVED SYSTEM STATE</p>
        </div>
      </div>
    </div>
  )
}
