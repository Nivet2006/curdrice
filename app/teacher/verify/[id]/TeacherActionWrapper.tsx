'use client'

import React, { useState } from 'react'
import { processTeacherVerification } from '@/lib/actions/faculty-actions'
import { FacultyReviewForm } from '@/components/faculty/FacultyReviewForm'

export function TeacherActionWrapper({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleAction(decision: 'approve' | 'reject', feedback: string) {
    setLoading(true)
    const res = await processTeacherVerification(eventId, decision, feedback)
    if (res?.error) {
      alert(res.error)
      setLoading(false)
    }
  }

  return (
    <FacultyReviewForm 
      onAction={handleAction} 
      loading={loading} 
      roleLabel="Teacher" 
    />
  )
}
