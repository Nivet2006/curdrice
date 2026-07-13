'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Check, Play, Settings, ShieldCheck, ShieldAlert, CheckCircle, HelpCircle, Download } from 'lucide-react'
import { runServiceTestsAction } from '@/lib/actions/tester-actions'

interface TestResult {
  status: 'passed' | 'failed' | 'skipped'
  message: string
  durationMs: number
}

export default function DiagnosticsPage() {
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'permission-service',
    'rate-limit-service',
    'venue-service',
    'event-service',
    'registration-service',
    'attendance-service',
    'club-service',
    'hackathon-service',
    'email-service',
    'notification-service',
    'media-service',
    'feedback-service',
    'certificate-service',
    'gamification-service',
    'analytics-service',
    'export-service',
    'qr-service',
    'calendar-service'
  ])

  const [results, setResults] = useState<Record<string, TestResult>>({})
  const [running, setRunning] = useState(false)
  const [globalStatus, setGlobalStatus] = useState<'idle' | 'success' | 'failed'>('idle')

  const services = [
    { id: 'permission-service', name: 'Permission Service', desc: 'Global roles & profile checks' },
    { id: 'rate-limit-service', name: 'Rate Limit Service', desc: 'Upstream rate checking' },
    { id: 'venue-service', name: 'Venue Service', desc: 'Event venue constraints' },
    { id: 'event-service', name: 'Event Service', desc: 'Core event management' },
    { id: 'registration-service', name: 'Registration Service', desc: 'Student registrations & waitlists' },
    { id: 'attendance-service', name: 'Attendance Service', desc: 'Student check-ins & logs' },
    { id: 'club-service', name: 'Club Service', desc: 'Club operations & stats' },
    { id: 'hackathon-service', name: 'Hackathon Service', desc: 'Hackathon team queries' },
    { id: 'email-service', name: 'Email Service', desc: 'Resend email configurations' },
    { id: 'notification-service', name: 'Notification Service', desc: 'Auto confirmations & reminders' },
    { id: 'media-service', name: 'Media Service', desc: 'B2 S3 photo storage checks' },
    { id: 'feedback-service', name: 'Feedback Service', desc: 'Post-event feedback status' },
    { id: 'certificate-service', name: 'Certificate Service', desc: 'Cert templates & validation' },
    { id: 'gamification-service', name: 'Gamification Service', desc: 'Leaderboards & student badges' },
    { id: 'analytics-service', name: 'Analytics Service', desc: 'Platform-wide count aggregates' },
    { id: 'export-service', name: 'Export Service', desc: 'ExcelJS & CSV exports' },
    { id: 'qr-service', name: 'QR Service', desc: 'UUID v4 QR validations' },
    { id: 'calendar-service', name: 'Calendar Service', desc: 'Time ranges & schedule overlaps' }
  ]

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
    setResults({})

    const res = await runServiceTestsAction(selectedServices)
    setRunning(false)

    if (res.error) {
      alert(`Error running diagnostic suite: ${res.error}`)
      setGlobalStatus('failed')
      return
    }

    if (res.data) {
      setResults(res.data)
      const hasFailures = Object.values(res.data).some(r => r.status === 'failed')
      setGlobalStatus(hasFailures ? 'failed' : 'success')
    }
  }

  const exportResults = () => {
    window.print()
  }

  // Calculate health score metrics
  const totalChecked = Object.keys(results).length
  const totalPassed = Object.values(results).filter(r => r.status === 'passed').length
  const healthPercent = totalChecked > 0 ? Math.round((totalPassed / totalChecked) * 100) : 0

  return (
    <div>
      {/* ── Screen Layout ────────────────────────────────────────────────────────── */}
      <div className="print:hidden w-full max-w-6xl mx-auto py-8 px-4">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2 text-[#0a0a0a] dark:text-white">
              System Diagnostics
            </h1>
            <p className="font-mono text-sm text-[#555555] dark:text-zinc-400">
              Verify integration state across core domain services
            </p>
          </div>

          <div className="flex items-center gap-3">
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
              {running ? 'TESTING...' : 'RUN DIAGNOSTICS'}
            </button>
          </div>
        </div>

        {/* Global Status Alert Banner */}
        {globalStatus !== 'idle' && (
          <div className={`mb-8 p-6 rounded-[2rem] border flex items-center gap-4 transition-all duration-500 animate-fadeIn ${
            globalStatus === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-300'
          }`}>
            {globalStatus === 'success' ? <ShieldCheck className="w-8 h-8 text-emerald-500" /> : <ShieldAlert className="w-8 h-8 text-red-500" />}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider font-mono">
                {globalStatus === 'success' ? 'SYSTEM GREEN' : 'INTEGRATION ISSUE DETECTED'}
              </h4>
              <p className="text-xs opacity-90 mt-0.5">
                {globalStatus === 'success'
                  ? 'All selected services successfully passed their integration validation tests.'
                  : 'One or more of the selected services failed integration validation. Inspect the output logs below.'}
              </p>
            </div>
          </div>
        )}

        {/* Services Check Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {services.map(service => {
            const isSelected = selectedServices.includes(service.id)
            const result = results[service.id]

            let statusClass = 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
            if (running && isSelected) {
              statusClass = 'border-blue-500 dark:border-blue-500/50 bg-blue-50/10 animate-pulse'
            } else if (result) {
              if (result.status === 'passed') {
                statusClass = 'border-emerald-500 dark:border-emerald-500/50 bg-emerald-50/10'
              } else if (result.status === 'failed') {
                statusClass = 'border-red-500 dark:border-red-500/50 bg-red-50/10'
              }
            }

            return (
              <Card
                key={service.id}
                onClick={() => !running && handleToggle(service.id)}
                className={`p-5 transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                  !running && 'hover:scale-[1.01] hover:shadow-md'
                } ${statusClass}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 group-hover:text-zinc-600 transition-colors uppercase">
                    {service.id.replace('-service', '')}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {result ? (
                      result.status === 'passed' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
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

                <h4 className="font-bold text-sm text-[#0a0a0a] dark:text-white mb-1">
                  {service.name}
                </h4>
                <p className="text-xs text-[#666] dark:text-zinc-400 leading-normal mb-3">
                  {service.desc}
                </p>

                {result && (
                  <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-[10px] font-mono">
                    <span className={`font-semibold ${
                      result.status === 'passed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
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
                  <span className="text-zinc-500 min-w-[150px] shrink-0 font-bold">[{serviceId}]</span>
                  <span className={`min-w-[70px] shrink-0 font-bold ${
                    result.status === 'passed' ? 'text-emerald-400' : result.status === 'failed' ? 'text-red-400' : 'text-zinc-600'
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

      {/* ── Print Health Report Layout (Only rendered during window.print()) ────────────────── */}
      <div className="hidden print:block font-sans text-black p-4 max-w-4xl mx-auto">
        {/* Header Block */}
        <div className="border-b-4 border-black pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">
              Club-Eve Platform Health Report
            </h1>
            <p className="text-xs font-mono text-zinc-500 mt-1">
              Document Ref: EVE-DIAG-{new Date().toISOString().split('T')[0]}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono">Date: {new Date().toLocaleString()}</p>
            <p className="text-xs font-mono">Operator: Administrator</p>
          </div>
        </div>

        {/* Global Summary Badge Panel */}
        <div className="grid grid-cols-3 gap-4 mb-8 border border-zinc-300 p-4 rounded-xl bg-zinc-50">
          <div className="text-center border-r border-zinc-200">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">System Integrity</span>
            <span className={`text-xl font-bold uppercase ${healthPercent === 100 ? 'text-emerald-600' : 'text-red-600'}`}>
              {healthPercent === 100 ? 'Healthy' : 'Degraded'}
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
        <h2 className="text-sm font-black uppercase tracking-wider mb-3">Service Diagnostics List</h2>
        <table className="w-full border-collapse border border-zinc-300 text-xs text-left mb-6">
          <thead>
            <tr className="bg-zinc-100 border-b border-zinc-300">
              <th className="p-3 border-r border-zinc-300 font-bold uppercase tracking-wider">Service Identifier</th>
              <th className="p-3 border-r border-zinc-300 font-bold uppercase tracking-wider">Integration Status</th>
              <th className="p-3 border-r border-zinc-300 font-bold uppercase tracking-wider">Latency</th>
              <th className="p-3 font-bold uppercase tracking-wider">Verification Output Logs</th>
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
                    res.status === 'passed' ? 'text-emerald-600' : res.status === 'failed' ? 'text-red-600' : 'text-zinc-500'
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
          <p>© Club-Eve Diagnostics Suite · All core operations verified.</p>
          <p className="text-right">Signature Stamp: APPROVED SYSTEM STATE</p>
        </div>
      </div>
    </div>
  )
}

