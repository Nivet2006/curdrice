import React from 'react'

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'admin' | 'manager' | 'student' | 'deleted' | 'cc' | 'pr' | 'teacher' | 'hod'
  children: React.ReactNode
}

export function Badge({ variant = 'student', children, className = '', ...props }: BadgeProps) {
  let styleClasses = ''
  
  switch(variant) {
    case 'admin':
      styleClasses = 'bg-[#0a0a0a] text-white dark:bg-white dark:text-[#0a0a0a] font-mono rounded-full px-3 py-1 text-xs'
      break;
    case 'manager':
    case 'cc':
    case 'pr':
      styleClasses = 'border-[1.5px] border-[#0a0a0a] text-[#0a0a0a] dark:border-[#e0e0e0] dark:text-[#e0e0e0] font-mono rounded-full px-3 py-1 text-xs bg-transparent'
      break;
    case 'teacher':
    case 'hod':
      styleClasses = 'bg-[#0a0a0a] text-white dark:bg-[#e0e0e0] dark:text-[#0a0a0a] font-mono rounded-full px-4 py-1.5 text-xs shadow-lg'
      break;
    case 'student':
      styleClasses = 'bg-[#eeeeee] text-[#555555] dark:bg-[#333] dark:text-[#ddd] font-sans rounded-full px-3 py-1 text-xs'
      break;
    case 'deleted':
      styleClasses = 'bg-[#ffeded] text-[#eb4b4b] border border-[#eb4b4b] dark:bg-[#eb4b4b]/20 dark:text-[#ff9999] dark:border-[#ff9999] rounded-full text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest'
      break;
  }

  return (
    <span className={`${styleClasses} ${className}`} {...props}>
      {children}
    </span>
  )
}
