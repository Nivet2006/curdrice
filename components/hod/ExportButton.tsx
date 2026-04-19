'use client'

import React, { useState } from 'react'
import { FileDown } from 'lucide-react'
import { exportToJSON } from '@/lib/utils/export'
import { createClient } from '@/lib/supabase/client'

export function ExportButton({ dept }: { dept: string }) {
  const [loading, setLoading] = useState(false)
  const supabase = await createClient()

  const handleExport = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select('*, profiles!created_by(full_name), reports(*)')
      .eq('targeted_department', dept)
      .eq('approval_status', 'approved')

    if (data) {
      exportToJSON(data, `${dept}_ClubEve_Export_${new Date().toISOString().split('T')[0]}`)
    }
    setLoading(false)
  }

  return (
    <button 
      onClick={handleExport}
      disabled={loading}
      className="bg-white border-2 border-black px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-black hover:text-white transition-all shadow-sm flex items-center gap-2"
    >
      <FileDown size={14} />
      {loading ? 'Exporting...' : 'Export Records'}
    </button>
  )
}
