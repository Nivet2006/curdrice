import { AdminHeader } from '@/components/admin/AdminHeader'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()

  if (!profile || profile.role !== 'admin') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[var(--bg)] text-[var(--fg)]">
      <AdminHeader role={profile.role} name={profile.full_name || undefined} />
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        {children}
      </main>
    </div>
  )
}
