import React from 'react'

export function Card({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-[#e0e0e0] bg-white shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all duration-150 ${className}`}
      {...props}
    />
  )
}
