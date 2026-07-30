import { Navbar } from '@/components/shared/Navbar'
import { getCachedAuthUser, getCachedUserProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Role } from '@/lib/types'

export default async function CCLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCachedAuthUser()

  if (!user) redirect('/login')

  const profile = await getCachedUserProfile(user.id)

  if (!profile || !['admin', 'cc'].includes(profile.role)) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar role={profile.role as Role} name={profile.full_name} />
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        {children}
      </main>
    </div>
  )
}
