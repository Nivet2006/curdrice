'use client'

import { useState, useEffect, useRef } from 'react'
import { Download } from 'lucide-react'

// ── Overlay ──────────────────────────────────────────────────────────────────
const STEPS = [
    { label: 'Fetching student profiles', detail: 'Reading semester & department data…' },
    { label: 'Loading events & constraints', detail: 'Mapping eligibility per semester…' },
    { label: 'Weaving attendance matrix', detail: 'Cross-referencing check-in records…' },
    { label: 'Styling worksheets', detail: 'Formatting cells, headers & borders…' },
    { label: 'Packaging workbook', detail: 'Compiling all semester sheets…' },
]

const GRID_COLS = 9
const GRID_ROWS = 7

function ExcelOverlay({ visible }: { visible: boolean }) {
    const [step, setStep] = useState(0)
    const [filled, setFilled] = useState<Set<number>>(new Set())
    const [dark, setDark] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const cellRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const totalCells = GRID_COLS * GRID_ROWS

    useEffect(() => {
        setDark(document.documentElement.getAttribute('data-theme') === 'dark')
        const obs = new MutationObserver(() =>
            setDark(document.documentElement.getAttribute('data-theme') === 'dark')
        )
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
        return () => obs.disconnect()
    }, [])

    useEffect(() => {
        if (!visible) {
            setStep(0)
            setFilled(new Set())
            if (timerRef.current) clearInterval(timerRef.current)
            if (cellRef.current) clearInterval(cellRef.current)
            return
        }

        timerRef.current = setInterval(() => {
            setStep(s => (s < STEPS.length - 1 ? s + 1 : s))
        }, 1400)

        const allCells = Array.from({ length: totalCells }, (_, i) => i)
        const shuffled = [...allCells].sort(() => Math.random() - 0.5)
        let idx = 0
        cellRef.current = setInterval(() => {
            setFilled(prev => {
                if (prev.size >= totalCells) { idx = 0; return new Set() }
                const next = new Set(prev)
                for (let i = 0; i < 3 && idx < shuffled.length; i++, idx++) next.add(shuffled[idx])
                return next
            })
        }, 80)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (cellRef.current) clearInterval(cellRef.current)
        }
    }, [visible])

    if (!visible) return null

    const bg = dark ? 'rgba(10,10,10,0.94)' : 'rgba(255,255,255,0.94)'
    const fg = dark ? '#e8e8e8' : '#1a1a2e'
    const sub = dark ? '#666' : '#888'

    const CELL_COLORS = [
        '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399',
        '#cffafe', '#a5f3fc', '#67e8f9',
        '#bbf7d0', '#86efac',
    ]

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: bg,
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
        }}>

            {/* ── Mini spreadsheet ──────────────────────────────────────────────── */}
            <div style={{
                border: `1.5px solid ${dark ? '#2a4a3a' : '#b0d4b0'}`,
                borderRadius: 10,
                overflow: 'hidden',
                marginBottom: 32,
                boxShadow: `0 2px 24px ${dark ? 'rgba(34,197,94,.08)' : 'rgba(22,163,74,.10)'}`,
            }}>
                {/* fake title bar */}
                <div style={{
                    background: dark ? '#0d1f12' : '#166534',
                    padding: '7px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                }}>
                    {['#ff5f57', '#febc2e', '#28c840'].map(c => (
                        <span key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, display: 'inline-block' }} />
                    ))}
                    <span style={{ color: '#a7f3d0', fontSize: 11, fontFamily: 'monospace', marginLeft: 8, opacity: .85 }}>
                        CurdRice_Attendance.xlsx
                    </span>
                </div>

                {/* grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `26px repeat(${GRID_COLS - 1}, 38px)`,
                    gridTemplateRows: `20px repeat(${GRID_ROWS - 1}, 19px)`,
                    gap: 1,
                    background: dark ? '#1a2e1a' : '#c8dcc8',
                    padding: 1,
                }}>
                    {Array.from({ length: GRID_ROWS }, (_, r) =>
                        Array.from({ length: GRID_COLS }, (_, c) => {
                            const idx = r * GRID_COLS + c
                            const isHeader = r === 0 || c === 0
                            const isFilled = !isHeader && filled.has(idx)
                            let cellBg = dark ? '#0f1f0f' : '#f0f8f0'
                            if (isHeader) cellBg = dark ? '#0d2a12' : '#14532d'
                            if (isFilled) cellBg = CELL_COLORS[(r * 3 + c) % CELL_COLORS.length]

                            return (
                                <div key={idx} style={{
                                    background: cellBg,
                                    transition: isFilled ? 'background 0.2s ease' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 9,
                                    color: isHeader ? '#4ade80' : (isFilled ? '#065f46' : 'transparent'),
                                    fontFamily: 'monospace',
                                    userSelect: 'none',
                                }}>
                                    {r === 0 && c > 0 && String.fromCharCode(64 + c)}
                                    {c === 0 && r > 0 && r}
                                    {isFilled && '✓'}
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* ── Step list ─────────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320 }}>
                {STEPS.map((s, i) => {
                    const done = i < step
                    const active = i === step
                    const pending = i > step
                    return (
                        <div key={i} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                            opacity: pending ? 0.3 : 1,
                            transition: 'opacity 0.5s',
                        }}>
                            <div style={{
                                width: 22,
                                height: 22,
                                minWidth: 22,
                                borderRadius: '50%',
                                background: done ? '#22c55e'
                                    : active ? (dark ? '#0d2a12' : '#f0fdf4')
                                        : (dark ? '#111' : '#f4f4f4'),
                                border: `1.5px solid ${done || active ? '#22c55e' : (dark ? '#333' : '#d0d0d0')}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.4s',
                                marginTop: 1,
                            }}>
                                {done && (
                                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                        <path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                                {active && (
                                    <div style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: '#22c55e',
                                        animation: 'xlsdot 1.2s ease-in-out infinite',
                                    }} />
                                )}
                            </div>

                            <div style={{ paddingTop: 1 }}>
                                <div style={{
                                    fontSize: 13,
                                    fontFamily: 'var(--font-mono, monospace)',
                                    fontWeight: active ? 600 : 400,
                                    color: active ? fg : (done ? (dark ? '#4ade80' : '#16a34a') : sub),
                                    transition: 'color 0.4s',
                                    letterSpacing: '0.01em',
                                }}>
                                    {s.label}
                                </div>
                                {active && (
                                    <div style={{
                                        fontSize: 11,
                                        color: sub,
                                        fontFamily: 'var(--font-mono, monospace)',
                                        marginTop: 3,
                                        animation: 'xlsfade 0.3s ease',
                                    }}>
                                        {s.detail}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <p style={{
                marginTop: 28,
                fontSize: 11,
                color: sub,
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.05em',
            }}>
                download will begin automatically
            </p>

            <style>{`
        @keyframes xlsdot  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }
        @keyframes xlsfade { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
        </div>
    )
}

// ── Button ────────────────────────────────────────────────────────────────────
export default function CombinedSheetButton() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleDownload() {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/admin/combined-sheet')
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body?.error ?? `Server error ${res.status}`)
            }
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `CurdRice_Attendance_${new Date().toISOString().split('T')[0]}.xlsx`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
        } catch (err: any) {
            setError(err.message ?? 'Download failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <ExcelOverlay visible={loading} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <button
                    onClick={handleDownload}
                    disabled={loading}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 16px',
                        background: '#1a1a2e',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 8,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: 13,
                        fontWeight: 500,
                        letterSpacing: '0.03em',
                        opacity: loading ? 0.5 : 1,
                        transition: 'opacity 0.2s',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <Download size={15} />
                    Combined Sheet
                </button>

                {error && (
                    <span style={{ fontSize: 11, color: '#eb4b4b', fontFamily: 'var(--font-mono)' }}>
                        {error}
                    </span>
                )}
            </div>
        </>
    )
}
