'use client'

import { useState, useEffect } from 'react'
import { Shield, ShieldAlert, ShieldCheck, Trash2, ArrowRight, X } from 'lucide-react'
import { TotpSetupWizard } from './TotpSetupWizard'
import { createClient } from '@/lib/supabase/client'

export function TotpSettingsCard() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [showSetup, setShowSetup] = useState(false)
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [disableCode, setDisableCode] = useState('')
  const [isDisabling, setIsDisabling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('totp_enabled').eq('id', user.id).single()
      setEnabled(!!data?.totp_enabled)
    }
  }

  const handleDisable = async () => {
    if (disableCode.length !== 6) return
    setIsDisabling(true)
    setError(null)
    
    try {
      const res = await fetch('/api/auth/totp/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: disableCode })
      })
      const data = await res.json()
      if (data.success) {
        setEnabled(false)
        setShowDisableModal(false)
        setDisableCode('')
      } else {
        setError(data.message || 'Invalid code. Could not disable security.')
      }
    } catch (err) {
      setError('System error during decommissioning.')
    } finally {
      setIsDisabling(false)
    }
  }

  if (enabled === null) return <div className="h-40 w-full bg-zinc-50 animate-pulse rounded-[2.5rem]" />

  return (
    <div className="w-full">
      <div className="bg-white border-2 border-black rounded-[2.5rem] overflow-hidden group/card relative">
        <div className="p-8 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl border-2 border-black transition-all group-hover/card:scale-105 ${enabled ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                {enabled ? <ShieldCheck className="text-emerald-600" /> : <ShieldAlert className="text-rose-600" />}
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-2">Two-Factor Authentication</h3>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className={`font-mono text-[9px] uppercase font-black tracking-widest ${enabled ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {enabled ? 'Active Sequence' : 'Protocol Suspended'}
                    </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-zinc-500 font-medium text-sm leading-relaxed mb-10 max-w-lg">
            {enabled 
              ? 'Your account is fortified with an additional layer of security. A rolling 6-digit access code is required for every administrative login sequence.'
              : 'Add an extra layer of defense to your administrative access. Enabling TOTP prevents unauthorized entry even if your password vector is compromised.'
            }
          </p>

          <div className="flex flex-wrap gap-4 pt-10 border-t-2 border-zinc-100">
            {enabled ? (
              <button 
                onClick={() => setShowDisableModal(true)}
                className="flex items-center gap-2 text-rose-600 border-2 border-rose-100 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-50 transition-all active:scale-95"
              >
                <Trash2 size={14} /> Deactivate 2FA
              </button>
            ) : (
              <button 
                onClick={() => setShowSetup(true)}
                className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-zinc-800 transition-all active:scale-95 shadow-lg group"
              >
                Configure Authenticator <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <Shield size={120} className="text-black" />
        </div>
      </div>

      {/* Setup Modal */}
      {showSetup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="max-w-2xl w-full relative">
              <button onClick={() => setShowSetup(false)} className="absolute -top-4 -right-4 w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center z-10 hover:bg-zinc-50 transition-all active:scale-90">
                 <X size={20} />
              </button>
              <TotpSetupWizard onCompleted={() => { setShowSetup(false); fetchStatus(); }} />
           </div>
        </div>
      )}

      {/* Disable Confirmation Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white border-4 border-black rounded-[3rem] p-12 max-w-md w-full relative text-center">
                <button onClick={() => setShowDisableModal(false)} className="absolute top-6 right-6 text-zinc-300 hover:text-black">
                    <X size={24} />
                </button>
                
                <div className="w-16 h-16 bg-rose-50 border-2 border-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
                    <ShieldAlert className="w-8 h-8 text-rose-600" />
                </div>
                
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Confirm Deactivation</h3>
                <p className="text-zinc-500 text-sm font-medium mb-8">
                    To disable Two-Factor Authentication, please enter the current 6-digit code from your app.
                </p>

                <div className="flex flex-col items-center gap-4 mb-10">
                    <input 
                        type="text" 
                        maxLength={6}
                        placeholder="000 000"
                        className="w-full border-2 border-black rounded-xl p-4 text-center font-mono text-2xl font-black tracking-[0.5em] focus:ring-4 ring-zinc-50 transition-all outline-none"
                        value={disableCode}
                        onChange={(e) => setDisableCode(e.target.value.replace(/[^0-9]/g, ''))}
                    />
                    {error && <p className="text-rose-600 font-mono text-[9px] uppercase font-black tracking-widest">{error}</p>}
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={() => setShowDisableModal(false)}
                        className="flex-1 border-2 border-black rounded-2xl py-4 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-50 transition-all"
                    >
                        Abort
                    </button>
                    <button 
                        onClick={handleDisable}
                        disabled={isDisabling || disableCode.length !== 6}
                        className="flex-1 bg-rose-600 text-white rounded-2xl py-4 font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Deactivate
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
