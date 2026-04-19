import { Navbar } from '@/components/shared/Navbar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Role } from '@/lib/types'

export default async function HODLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()

  if (!profile || !['admin', 'hod'].includes(profile.role)) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar role={profile.role as Role} name={profile.full_name} />
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-8 py-10">
        {children}
      </main>
    </div>
  )
}
