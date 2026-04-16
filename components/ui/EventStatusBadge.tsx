import React from 'react'

export function EventStatusBadge({ status, className = '' }: { status: string, className?: string }) {
  let styleClasses = ''
  
  switch(status.toLowerCase()) {
    case 'upcoming':
      styleClasses = 'bg-[#f0fdf4] text-[#166534]' // Green
      break;
    case 'ongoing':
      styleClasses = 'bg-[#fefce8] text-[#854d0e]' // Yellow
      break;
    case 'completed':
      styleClasses = 'bg-[#fef2f2] text-[#991b1b]' // Red
      break;
    case 'cancelled':
    default:
      styleClasses = 'bg-[#f5f5f5] text-[#555555]' // Grey
      break;
  }

  return (
    <div className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm inline-block ${styleClasses} ${className}`}>
      {status}
    </div>
  )
}
