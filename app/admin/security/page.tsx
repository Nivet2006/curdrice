import React from 'react'
import { TotpSettingsCard } from '@/components/auth/TotpSettingsCard'
import { Shield, Fingerprint, Lock, Key } from 'lucide-react'

export default function AdminSecurityPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 space-y-10">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase text-zinc-400 tracking-widest leading-none">
          <Shield size={12} />
          Access Control — Administrative Security
        </div>
        <h1 className="text-4xl font-black tracking-tighter leading-none uppercase">Account Hardening</h1>
        <p className="font-mono text-xs text-zinc-400 uppercase tracking-tight">
          Manage identity verification vectors and forensic authentication protocols.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-10">
        <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Fingerprint size={16} className="text-black" />
                <h2 className="text-lg font-black uppercase tracking-tight">Two-Step Verification</h2>
            </div>
            <TotpSettingsCard />
        </section>

        <section className="bg-zinc-50 border-2 border-black rounded-[2.5rem] p-10 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <Lock size={24} className="text-black" />
                    <h3 className="text-xl font-black uppercase tracking-tight">Security Guidelines</h3>
                </div>
                <ul className="space-y-4 max-w-lg">
                    {[
                        'Administrator accounts are high-value targets. Always use a unique, complex password.',
                        'TOTP (Time-based One-Time Password) is the recommended secondary authentication vector.',
                        'Never share your authenticator secret key or QR code with other staff members.',
                        'Audit logs are recorded for all security-sensitive operations.'
                    ].map((tip, i) => (
                        <li key={i} className="flex gap-4 group">
                            <div className="flex flex-col items-center pt-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-black group-hover:scale-150 transition-transform" />
                            </div>
                            <p className="text-xs font-mono text-zinc-500 uppercase font-bold leading-relaxed">{tip}</p>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                <Key size={140} className="text-black" />
            </div>
        </section>
      </div>
    </div>
  )
}
