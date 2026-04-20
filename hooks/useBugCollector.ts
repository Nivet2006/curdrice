'use client'

import { useEffect, useRef } from 'react'

export interface CollectedData {
  clickTrail: string[]
  jsErrors: string[]
}

const MAX_CLICKS = 10
const clickTrail: string[] = []
const jsErrors: string[] = []

if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const label = target.tagName + (target.id ? `#${target.id}` : '') + (target.className ? `.${String(target.className).split(' ')[0]}` : '')
    clickTrail.unshift(`${label} @ ${window.location.pathname}`)
    if (clickTrail.length > MAX_CLICKS) clickTrail.pop()
  }, { capture: true, passive: true })

  window.addEventListener('error', (e: ErrorEvent) => {
    jsErrors.unshift(`${e.message} (${e.filename}:${e.lineno})`)
    if (jsErrors.length > 20) jsErrors.pop()
  })

  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    jsErrors.unshift(`UnhandledPromise: ${e.reason}`)
    if (jsErrors.length > 20) jsErrors.pop()
  })
}

export function getCollectedData(): CollectedData {
  return {
    clickTrail: [...clickTrail],
    jsErrors: [...jsErrors],
  }
}
