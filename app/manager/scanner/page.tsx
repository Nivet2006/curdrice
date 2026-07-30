'use client'
import dynamic from 'next/dynamic'

const QRScanner = dynamic(() => import('@/components/manager/QRScanner').then(mod => mod.QRScanner), {
  ssr: false,
  loading: () => <div className="max-w-md mx-auto p-12 border border-[#e0e0e0] border-dashed rounded-2xl text-center font-mono text-sm text-[#999]">Loading camera driver...</div>
})

export default async function ManagerScannerPage() {
  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-2 text-[#0a0a0a]">Scanner</h1>
        <p className="font-mono text-sm text-[#555555]">Scan QR codes directly from your camera to log real-time attendance.</p>
      </div>

      <div className="mt-8">
        <QRScanner />
      </div>
    </div>
  )
}
