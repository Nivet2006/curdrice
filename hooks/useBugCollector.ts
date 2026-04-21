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
  // Track initial page
  clickTrail.unshift(`PAGE_LOAD: ${window.location.pathname}`)

  // Navigation tracking
  const trackNav = () => {
    const lastEntry = clickTrail[0]
    const currentPath = `PAGE_NAV: ${window.location.pathname}`
    if (lastEntry !== currentPath) {
      clickTrail.unshift(currentPath)
      if (clickTrail.length > MAX_CLICKS) clickTrail.pop()
    }
  }

  window.addEventListener('popstate', trackNav)
  
  // Patch pushState/replaceState for SPA navigation detection
  const originalPushState = window.history.pushState
  window.history.pushState = function(...args: any[]) {
    originalPushState.apply(this, args)
    trackNav()
  }
  
  const originalReplaceState = window.history.replaceState
  window.history.replaceState = function(...args: any[]) {
    originalReplaceState.apply(this, args)
    trackNav()
  }

  window.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const label = target.tagName + (target.id ? `#${target.id}` : '') + (target.className ? `.${String(target.className).split(' ')[0]}` : '')
    clickTrail.unshift(`CLICK: ${label} @ ${window.location.pathname}`)
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
