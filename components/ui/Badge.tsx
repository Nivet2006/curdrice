import React from 'react'

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'admin' | 'manager' | 'student' | 'deleted'
  children: React.ReactNode
}

export function Badge({ variant = 'student', children, className = '', ...props }: BadgeProps) {
  let styleClasses = ''
  
  switch(variant) {
    case 'admin':
      styleClasses = 'bg-[#0a0a0a] text-white font-mono rounded-full px-3 py-1 text-xs'
      break;
    case 'manager':
      styleClasses = 'border-[1.5px] border-[#0a0a0a] text-[#0a0a0a] font-mono rounded-full px-3 py-1 text-xs bg-transparent'
      break;
    case 'student':
      styleClasses = 'bg-[#eeeeee] text-[#555555] font-sans rounded-full px-3 py-1 text-xs'
      break;
    case 'deleted':
      styleClasses = 'bg-[#ffeded] text-[#eb4b4b] border border-[#eb4b4b] rounded-full text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest'
      break;
  }

  return (
    <span className={`${styleClasses} ${className}`} {...props}>
      {children}
    </span>
  )
}
