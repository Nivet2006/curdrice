import { Navbar } from '@/components/shared/Navbar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Role } from '@/lib/types'

export default async function PRLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()

  if (!profile || !['admin', 'pr'].includes(profile.role)) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar role={profile.role as Role} name={profile.full_name} />
      
      {/* Sleek, Non-dismissible Android App Download Banner */}
      <div className="bg-[#facc15] text-black py-3 px-6 text-center text-[10px] font-mono tracking-widest font-black uppercase flex flex-col sm:flex-row items-center justify-center gap-3 border-b border-black dark:border-zinc-800 shadow-md">
        <span className="flex items-center gap-1.5">
          <span className="text-base animate-pulse">📱</span>
          Optimized QR scanning: Download the official ClubEve Android App to take attendance instantly.
        </span>
        <a 
          href="/downloads/app-release.apk"
          download
          className="px-3.5 py-1 bg-black text-white hover:bg-zinc-800 dark:hover:bg-zinc-900 transition-all rounded-full font-black text-[9px] tracking-widest active:scale-95 shadow-sm inline-flex items-center"
        >
          Download APK
        </a>
      </div>

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-8 py-10">
        {children}
      </main>
    </div>
  )
}
