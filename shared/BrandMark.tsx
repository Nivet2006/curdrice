import React from 'react'

export const BrandMark = ({ className = '' }: { className?: string }) => (
  <span className={`font-mono text-sm tracking-widest select-none text-[#999999] ${className}`}>
    |||··||
  </span>
)
