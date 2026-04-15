'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { registerForEvent } from '@/lib/actions/events'
import { useRouter } from 'next/navigation'

export function RegisterButton({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  
  const router = useRouter()

  const handleRegister = async () => {
    setLoading(true)
    const res = await registerForEvent(eventId)
    setLoading(false)

    if (res.error) {
       setToast({ message: res.error, type: 'error' })
       setTimeout(() => setToast(null), 3500)
    } else {
       setRegistered(true)
       setToast({ message: 'Success! You are now registered.', type: 'success' })
       
       // Force a router refresh to update the global metrics above (e.g. attendance fraction)
       router.refresh()
       
       setTimeout(() => setToast(null), 4000)
    }
  }

  return (
    <>
      <div className="mt-6">
        <Button 
          type="button" 
          onClick={handleRegister} 
          disabled={loading || registered}
          className={`w-full ${registered ? 'opacity-50 cursor-not-allowed bg-[#0a0a0a]' : 'bg-[#0a0a0a] hover:bg-[#222222]'} text-white transition-colors`}
        >
          {loading ? 'Confirming...' : registered ? 'Registered ✓' : 'Register for this Event'}
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
