'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react'
import type { Event, Role } from '@/lib/types'
import { getDynamicEventStatus } from '@/lib/event-utils'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EventCalendarProps {
  events: Event[]
  /** eventId → qrToken (only for students who registered) */
  registrationMap?: Record<string, string>
  /** eventId → total registration count (to detect "FULL") */
  registrationCounts?: Record<string, number>
  /** Current user's role – determines link prefix */
  role: Role
}

type ViewMode = 'month' | 'week'

interface EnrichedEvent extends Event {
  dynamicStatus: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]
const MONTHS_SHORT = MONTHS.map(m => m.slice(0, 3))

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

/** Returns offset for Monday-start grid (Mon=0 … Sun=6) */
function getFirstDayOffset(year: number, month: number) {
  const d = new Date(year, month, 1).getDay() // 0=Sun
  return d === 0 ? 6 : d - 1
}

/** Returns 7 Date objects for the week containing `date` (Mon→Sun) */
function getWeekDates(date: Date): Date[] {
  const d = new Date(date)
  const dow = d.getDay() // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + diff)
  return Array.from({ length: 7 }, (_, i) => {
    const wd = new Date(d)
    wd.setDate(d.getDate() + i)
    return wd
  })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function getLinkPrefix(role: Role): string {
  switch (role) {
    case 'student': return '/student/events'
    case 'cc':      return '/cc/events'
    case 'manager': return '/manager/events'
    case 'teacher': return '/teacher/verify'
    case 'hod':     return '/teacher/verify'
    case 'admin':   return '/student/events'
    case 'pr':      return '/pr/events'
    default:        return '/student/events'
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric', minute: '2-digit', hour12: true
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EventCalendar({
  events,
  registrationMap = {},
  registrationCounts = {},
  role,
}: EventCalendarProps) {
  const [view, setView] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  const linkPrefix = getLinkPrefix(role)
  const today = useMemo(() => new Date(), [])

  // ── Enrich events with dynamic status ──
  const enrichedEvents: EnrichedEvent[] = useMemo(
    () => events.map(e => ({
      ...e,
      dynamicStatus: getDynamicEventStatus(e.event_date, e.status)
    })),
    [events]
  )

  // ── Bucket events by date key ──
  const eventsByDate = useMemo(() => {
    const map: Record<string, EnrichedEvent[]> = {}
    for (const e of enrichedEvents) {
      const k = dateKey(new Date(e.event_date))
      if (!map[k]) map[k] = []
      map[k].push(e)
    }
    // Sort each bucket by time
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    }
    return map
  }, [enrichedEvents])

  // ── Navigation ──
  const navigatePrev = () => {
    const d = new Date(currentDate)
    view === 'month' ? d.setMonth(d.getMonth() - 1) : d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }
  const navigateNext = () => {
    const d = new Date(currentDate)
    view === 'month' ? d.setMonth(d.getMonth() + 1) : d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }
  const goToToday = () => setCurrentDate(new Date())

  // ── Month grid (6 rows × 7 cols, null = out-of-month) ──
  const monthGrid = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const offset = getFirstDayOffset(year, month)
    const cells: (Date | null)[] = []
    for (let i = 0; i < offset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    while (cells.length < 42) cells.push(null)
    return cells
  }, [currentDate, view])

  // ── Week dates ──
  const weekDates = useMemo(() => view === 'week' ? getWeekDates(currentDate) : [], [currentDate, view])

  // ── Week header label ──
  const weekLabel = useMemo(() => {
    if (view !== 'week' || weekDates.length === 0) return ''
    const s = weekDates[0], e = weekDates[6]
    if (s.getMonth() === e.getMonth()) {
      return `${s.getDate()} – ${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`
    }
    return `${s.getDate()} ${MONTHS_SHORT[s.getMonth()]} – ${e.getDate()} ${MONTHS_SHORT[e.getMonth()]} ${e.getFullYear()}`
  }, [view, weekDates])

  // ── Helpers for event rendering ──
  function isEventFull(ev: EnrichedEvent): boolean {
    if (!ev.max_capacity || ev.max_capacity === 0) return false
    const count = registrationCounts[ev.id] ?? 0
    return count >= ev.max_capacity
  }
  function isEventUnlimited(ev: EnrichedEvent): boolean {
    return !ev.max_capacity || ev.max_capacity === 0
  }

  // ── Shared event pill (used in both month + week views) ──
  function renderPill(ev: EnrichedEvent, showLocation = false) {
    const isRegistered = !!registrationMap[ev.id]
    const isCompleted = ev.dynamicStatus === 'completed'
    const isOngoing   = ev.dynamicStatus === 'ongoing'
    const full        = isEventFull(ev)
    const unlimited   = isEventUnlimited(ev)
    const time        = formatTime(ev.event_date)

    // Card style
    let cardBg = 'bg-white border-[#e8e8e8]'
    let textCls = 'text-[#0a0a0a]'
    if (isCompleted) {
      cardBg = 'bg-zinc-100 border-zinc-200 opacity-40'
      textCls = 'text-zinc-400'
    } else if (isRegistered) {
      cardBg = 'bg-emerald-50 border-emerald-400'
      textCls = 'text-emerald-900'
    } else if (isOngoing) {
      cardBg = 'bg-amber-50 border-amber-400'
      textCls = 'text-amber-900'
    }

    return (
      <Link
        key={ev.id}
        href={`${linkPrefix}/${ev.id}`}
        onClick={e => e.stopPropagation()}
        className={`block rounded-lg border p-1.5 text-left transition-all hover:shadow-md hover:-translate-y-px ${cardBg}`}
        title={`${ev.title}\n${time}${ev.location ? ' · ' + ev.location : ''}`}
      >
        {/* Title */}
        <div className={`text-[10px] font-bold leading-tight line-clamp-2 ${textCls}`}>
          {ev.title}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          <span className="font-mono text-[9px] text-zinc-500 flex items-center gap-0.5 shrink-0">
            <Clock size={8} className="opacity-60" />{time}
          </span>
          {full && !isCompleted && (
            <span className="text-[8px] font-mono font-black uppercase tracking-widest text-rose-600 bg-rose-50 border border-rose-200 px-1 rounded shrink-0">
              Full
            </span>
          )}
          {unlimited && !isCompleted && !full && (
            <span className="text-[10px] text-indigo-500 font-black shrink-0" title="Unlimited seats">∞</span>
          )}
          {isCompleted && (
            <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-400 bg-zinc-200/70 px-1 rounded shrink-0">Done</span>
          )}
        </div>

        {/* Location (optional) */}
        {showLocation && ev.location && (
          <div className="flex items-center gap-0.5 mt-0.5 min-w-0">
            <MapPin size={8} className="text-zinc-400 flex-shrink-0" />
            <span className="font-mono text-[9px] text-zinc-500 truncate">{ev.location}</span>
          </div>
        )}
      </Link>
    )
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full pb-16">

      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <h1 className="text-3xl font-black text-[#0a0a0a] dark:text-white tracking-tight uppercase">Calendar</h1>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-full border border-[#e0e0e0] overflow-hidden"
            style={{ background: 'var(--bg-subtle, #f5f5f5)' }}>
            {(['month', 'week'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-1.5 text-xs font-mono capitalize transition-colors ${
                  view === v ? 'bg-[#0a0a0a] text-white' : 'text-[#555] hover:text-black dark:text-zinc-400 dark:hover:text-white'
                }`}>
                {v}
              </button>
            ))}
          </div>
          {/* Nav buttons */}
          <div className="flex items-center gap-1">
            <button onClick={navigatePrev}
              className="w-8 h-8 rounded-full border border-[#e0e0e0] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-zinc-800 transition-colors">
              <ChevronLeft size={14} />
            </button>
            <button onClick={goToToday}
              className="px-3 h-8 rounded-full border border-[#e0e0e0] text-[11px] font-mono hover:bg-[#f5f5f5] dark:hover:bg-zinc-800 transition-colors uppercase tracking-widest">
              Today
            </button>
            <button onClick={navigateNext}
              className="w-8 h-8 rounded-full border border-[#e0e0e0] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-zinc-800 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Period label ── */}
      <div className="mb-3">
        <h2 className="text-xl font-black text-[#0a0a0a] dark:text-white tracking-tight">
          {view === 'month'
            ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
            : weekLabel
          }
        </h2>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-3 mb-4 font-mono text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-400" />
          Registered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-amber-100 border border-amber-400" />
          Ongoing
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-zinc-100 border border-zinc-200 opacity-40" />
          Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-indigo-500 font-black text-xs">∞</span>
          Unlimited
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-1 rounded uppercase">Full</span>
          At Capacity
        </span>
      </div>

      {/* ─────────────────── MONTH VIEW ─────────────────── */}
      {view === 'month' && (
        <div className="border border-[#e0e0e0] dark:border-zinc-700 rounded-2xl overflow-hidden select-none">
          {/* Weekday header */}
          <div className="grid grid-cols-7 border-b border-[#e0e0e0] dark:border-zinc-700 bg-[#fafafa] dark:bg-zinc-900">
            {WEEKDAYS.map((d, i) => (
              <div key={i}
                className="py-2.5 text-center font-mono text-[10px] uppercase tracking-widest text-[#999] dark:text-zinc-500 border-r border-[#e0e0e0] dark:border-zinc-700 last:border-r-0">
                {d}
              </div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7">
            {monthGrid.map((cellDate, idx) => {
              if (!cellDate) return (
                <div key={idx}
                  className="min-h-[96px] md:min-h-[110px] border-r border-b border-[#f0f0f0] dark:border-zinc-800 bg-[#fafafa]/50 dark:bg-zinc-950/30 last:border-r-0" />
              )

              const k = dateKey(cellDate)
              const dayEvents = eventsByDate[k] || []
              const isToday = isSameDay(cellDate, today)
              const overflow = dayEvents.length - 3

              return (
                <div key={idx}
                  className={`min-h-[96px] md:min-h-[110px] border-r border-b border-[#f0f0f0] dark:border-zinc-800 p-1 last:border-r-0 flex flex-col ${
                    isToday ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''
                  }`}>
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-0.5 px-0.5">
                    <span className={`text-[11px] font-bold tabular-nums ${
                      isToday
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-[#0a0a0a] dark:text-zinc-200'
                    }`}>
                      {cellDate.getDate()}
                    </span>
                    {overflow > 0 && (
                      <span className="font-mono text-[9px] text-zinc-400 dark:text-zinc-500 shrink-0">
                        +{overflow}
                      </span>
                    )}
                  </div>
                  {/* Event pills (max 3) */}
                  <div className="flex flex-col gap-0.5 flex-1 min-h-0">
                    {dayEvents.slice(0, 3).map(ev => renderPill(ev))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─────────────────── WEEK VIEW ──────────────────── */}
      {view === 'week' && weekDates.length > 0 && (
        <div className="border border-[#e0e0e0] dark:border-zinc-700 rounded-2xl overflow-hidden select-none">
          {/* Day headers with date */}
          <div className="grid grid-cols-7 border-b border-[#e0e0e0] dark:border-zinc-700 bg-[#fafafa] dark:bg-zinc-900">
            {weekDates.map((d, i) => {
              const isToday = isSameDay(d, today)
              return (
                <div key={i}
                  className={`py-2.5 text-center border-r border-[#e0e0e0] dark:border-zinc-700 last:border-r-0 ${
                    isToday ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''
                  }`}>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[#999] dark:text-zinc-500">{WEEKDAYS[i]}</div>
                  <div className={`text-sm font-black mt-0.5 tabular-nums ${
                    isToday ? 'text-blue-600 dark:text-blue-400' : 'text-[#0a0a0a] dark:text-zinc-200'
                  }`}>
                    {d.getDate()}
                  </div>
                </div>
              )
            })}
          </div>
          {/* Day columns */}
          <div className="grid grid-cols-7">
            {weekDates.map((d, i) => {
              const k = dateKey(d)
              const dayEvents = eventsByDate[k] || []
              const isToday = isSameDay(d, today)

              return (
                <div key={i}
                  className={`min-h-[420px] border-r border-[#f0f0f0] dark:border-zinc-800 last:border-r-0 p-1.5 flex flex-col gap-1 ${
                    isToday ? 'bg-blue-50/40 dark:bg-blue-950/10' : ''
                  }`}>
                  {dayEvents.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="font-mono text-[9px] text-zinc-300 dark:text-zinc-600">—</span>
                    </div>
                  ) : dayEvents.map(ev => (
                    <div key={ev.id}>{renderPill(ev, /* showLocation */ true)}</div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
