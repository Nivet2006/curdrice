'use client'
import dynamic from 'next/dynamic'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

const QRScanner = dynamic(() => import('@/components/manager/QRScanner').then(mod => mod.QRScanner), {
  ssr: false,
  loading: () => <div className="max-w-md mx-auto p-12 border border-[var(--border)] border-dashed rounded-2xl text-center font-mono text-sm text-[var(--fg-muted)]">Loading camera driver...</div>
})

export default function AdminScannerPage() {
  return (
    <div className="w-full space-y-6">
      <AdminPageHeader
        breadcrumbs={[{ label: 'Operations' }, { label: 'Ticket Scanner' }]}
        title="Ticket Scanner"
        subtitle="Scan student registration QR tickets directly from your camera to log real-time attendance."
      />

      <div>
        <QRScanner />
      </div>
    </div>
  )
}
