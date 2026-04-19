'use client'

import { useState } from 'react'
import { QrCode, ShieldCheck, ArrowRight, Loader2, Copy, CheckCircle2, AlertTriangle, Smartphone } from 'lucide-react'
import { TotpCodeInput } from './TotpCodeInput'
import Image from 'next/image'

type WizardStep = 'idle' | 'loading-setup' | 'scan' | 'verify' | 'success' | 'error'

export function TotpSetupWizard({ onCompleted }: { onCompleted: () => void }) {
  const [step, setStep] = useState<WizardStep>('idle')
  const [setupData, setSetupData] = useState<{ qrCodeUrl: string, secret: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [copied, setCopied] = useState(false)

  const startSetup = async () => {
    setStep('loading-setup')
    try {
      const res = await fetch('/api/auth/totp/setup', { method: 'POST' })
      const data = await res.json()
      if (data.qrCodeUrl) {
        setSetupData(data)
        setStep('scan')
      } else {
        throw new Error(data.message || 'Setup failed')
      }
    } catch (err: any) {
      setError(err.message)
      setStep('error')
    }
  }

  const handleVerify = async (code: string) => {
    setIsVerifying(true)
    try {
      const res = await fetch('/api/auth/totp/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      const data = await res.json()
      if (data.success) {
        setStep('success')
      } else {
        setError(data.message || 'Invalid code. Please try again.')
      }
    } catch (err) {
      setError('System verification error.')
    } finally {
      setIsVerifying(false)
    }
  }

  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white border-2 border-black rounded-[2.5rem] p-10 overflow-hidden relative">
        
        {/* Step 1: Idle */}
        {step === 'idle' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <ShieldCheck size={24} />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tight">Enhanced Security</h2>
            </div>
            <p className="text-zinc-600 font-medium mb-10 leading-relaxed text-sm">
              Level up your admin account security by enabling Two-Factor Authentication. 
              Protect your credentials with a revolving 6-digit access code generated on your personal device.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {[
                    { icon: Smartphone, text: 'Installs on any device' },
                    { icon: QrCode, text: 'Quick QR scan setup' },
                    { icon: ShieldCheck, text: 'Irrevocable protection' }
                ].map((item, i) => (
                    <div key={i} className="p-4 border-2 border-zinc-100 rounded-2xl flex flex-col items-center text-center gap-3">
                        <item.icon className="text-zinc-400" size={20} />
                        <span className="font-mono text-[10px] uppercase font-black leading-tight text-zinc-500">{item.text}</span>
                    </div>
                ))}
            </div>
            <button 
              onClick={startSetup}
              className="w-full bg-black text-white rounded-2xl py-5 font-black uppercase text-sm tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 group active:scale-95"
            >
              Initiate Handshake <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Loading */}
        {step === 'loading-setup' && (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-black" />
            <p className="font-mono text-[10px] uppercase font-black tracking-widest text-zinc-400">Generating Secure Vault Access...</p>
          </div>
        )}

        {/* Step 2: Scan */}
        {step === 'scan' && setupData && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col items-center">
            <div className="text-center mb-8">
                <p className="font-mono text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-2">Protocol: Scan Vector</p>
                <h3 className="text-2xl font-black uppercase tracking-tight">Sync Authenticator</h3>
            </div>
            
            <div className="p-6 bg-zinc-50 border-2 border-black rounded-[2rem] mb-8 relative group">
                <div className="bg-white p-4 rounded-xl border border-zinc-200">
                    <img src={setupData.qrCodeUrl} alt="TOTP QR Code" className="w-[200px] h-[200px] grayscale brightness-110 contrast-125" />
                </div>
            </div>

            <div className="w-full bg-zinc-50 rounded-2xl p-6 border-2 border-dashed border-zinc-200 mb-10">
                <label className="font-mono text-[9px] uppercase font-black tracking-widest text-zinc-400 mb-2 block">Manual Entry Key</label>
                <div className="flex items-center justify-between">
                    <code className="font-mono text-xl font-black tracking-widest text-black">{setupData.secret}</code>
                    <button onClick={copySecret} className="text-zinc-400 hover:text-black transition-colors tooltip flex items-center gap-2 font-mono text-[10px] font-black uppercase">
                        {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
            </div>

            <button 
              onClick={() => setStep('verify')}
              className="w-full bg-black text-white rounded-2xl py-5 font-black uppercase text-sm tracking-widest hover:bg-zinc-800 transition-all active:scale-95"
            >
              Device Synced, Proceed
            </button>
          </div>
        )}

        {/* Step 3: Verify */}
        {step === 'verify' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center mb-10">
                <p className="font-mono text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-2">Protocol: Identity Proof</p>
                <h3 className="text-2xl font-black uppercase tracking-tight">Confirm Connection</h3>
            </div>
            
            <div className="mb-12">
              <TotpCodeInput 
                onComplete={handleVerify}
                isLoading={isVerifying}
                error={error}
                onReset={() => setError(null)}
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <Smartphone size={16} className="text-zinc-400" />
                <p className="text-[10px] font-medium text-zinc-500 leading-tight">
                    Enter the rolling 6-digit sequence from your app to finalize the security bond.
                </p>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="animate-in zoom-in duration-500 text-center py-6">
            <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-4xl font-black uppercase tracking-tight mb-4 text-black">Bond Encrypted</h3>
            <p className="text-zinc-500 font-medium mb-10 max-w-sm mx-auto leading-relaxed">
              Two-Factor Authentication is now active. Your administrative portal is secured behind a forensic-grade TOTP gate.
            </p>
            <button 
              onClick={onCompleted}
              className="w-full bg-black text-white rounded-2xl py-5 font-black uppercase text-sm tracking-widest hover:bg-zinc-800 transition-all active:scale-95"
            >
              Finalize & Exit
            </button>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="animate-in shake duration-500 text-center py-10">
            <div className="w-16 h-16 bg-red-50 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-3">System Denial</h3>
            <p className="text-zinc-400 font-mono text-[10px] uppercase font-black tracking-widest mb-10">{error || 'Generic protocol error'}</p>
            <button 
              onClick={() => setStep('idle')}
              className="px-8 py-4 border-2 border-black rounded-xl font-black uppercase text-xs hover:bg-zinc-50 transition-all active:scale-95"
            >
              Restart Protocol
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
