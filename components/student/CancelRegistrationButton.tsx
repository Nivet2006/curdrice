'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cancelRegistration } from '@/lib/actions/events'
import { useRouter } from 'next/navigation'

export function CancelRegistrationButton({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const router = useRouter()

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your registration? If there is a waitlist, you will lose your spot.')) {
      return
    }

    setLoading(true)
    const res = await cancelRegistration(eventId)
    setLoading(false)

    if (res.error) {
      setToast({ message: res.error, type: 'error' })
      setTimeout(() => setToast(null), 3500)
    } else {
      setCancelled(true)
      setToast({ message: 'Success! Your registration was cancelled.', type: 'success' })
      
      router.refresh()
      setTimeout(() => setToast(null), 4000)
    }
  }

  return (
    <>
      <div className="mt-4">
        <Button 
          type="button" 
          onClick={handleCancel} 
          disabled={loading || cancelled}
          className={`w-full ${cancelled ? 'opacity-50 cursor-not-allowed bg-zinc-400' : 'bg-transparent border border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-500'} font-semibold transition-all`}
        >
          {loading ? 'Cancelling...' : cancelled ? 'Cancelled' : 'Cancel Registration'}
        </Button>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 border rounded-xl shadow-2xl font-mono text-xs md:text-sm transform transition-all duration-300 translate-y-0 opacity-100 ${toast.type === 'success' ? 'bg-[#0a0a0a] text-white border-[#333]' : 'bg-[#eb4b4b] text-white border-red-700'}`}>
           <div className="flex items-center gap-3">
              <span className="text-lg">{toast.type === 'success' ? '✓' : '✗'}</span>
              <span>{toast.message}</span>
           </div>
        </div>
      )}
    </>
  )
}
