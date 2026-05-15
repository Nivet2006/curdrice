import React from 'react'

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'admin' | 'manager' | 'student' | 'deleted' | 'cc' | 'pr' | 'teacher' | 'hod'
  children: React.ReactNode
}

export function Badge({ variant = 'student', children, className = '', ...props }: BadgeProps) {
  let styleClasses = ''
  
  switch(variant) {
    case 'admin':
      styleClasses = 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-mono rounded-full px-3 py-1 text-xs'
      break;
    case 'manager':
    case 'cc':
    case 'pr':
      styleClasses = 'border-[1.5px] border-zinc-950 text-zinc-950 dark:border-zinc-300 dark:text-zinc-300 font-mono rounded-full px-3 py-1 text-xs bg-transparent'
      break;
    case 'teacher':
    case 'hod':
      styleClasses = 'bg-zinc-950 text-white dark:bg-zinc-300 dark:text-zinc-950 font-mono rounded-full px-4 py-1.5 text-xs shadow-lg'
      break;
    case 'student':
      styleClasses = 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 font-sans rounded-full px-3 py-1 text-xs'
      break;
    case 'deleted':
      styleClasses = 'bg-red-50 text-red-600 border border-red-600 dark:bg-red-500/20 dark:text-red-300 dark:border-red-300 rounded-full text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest'
      break;
  }

  return (
    <span className={`${styleClasses} ${className}`} {...props}>
      {children}
    </span>
  )
}
