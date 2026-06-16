'use client'

import React, { useState } from 'react'
import { processHODApproval } from '@/lib/actions/faculty-actions'
import { FacultyReviewForm } from '@/components/faculty/FacultyReviewForm'

export function HODActionWrapper({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleAction(decision: 'approve' | 'reject', feedback: string) {
    setLoading(true)
    const res = await processHODApproval(eventId, decision, feedback)
    if (res?.error) {
      alert(res.error)
      setLoading(false)
    }
  }

  async function handleBypass(code: string) {
    setLoading(true)
    const { bypassEventApprovalAction } = await import('@/lib/actions/bypass')
    const res = await bypassEventApprovalAction(eventId, code)
    if (res?.error) {
      alert(res.error)
      setLoading(false)
    } else {
      alert("Event bypassed and approved successfully!")
      window.location.href = '/hod/dashboard'
    }
  }

  return (
    <FacultyReviewForm 
      onAction={handleAction} 
      loading={loading} 
      roleLabel="HOD" 
      onBypass={handleBypass}
    />
  )
}
