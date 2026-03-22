import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger' | 'icon'
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  let styleClasses = ''

  switch (variant) {
    case 'primary':
      styleClasses = 'bg-black text-white rounded-full px-6 py-2.5 font-semibold hover:bg-[#333333] transition-colors duration-100'
      break
    case 'ghost':
      styleClasses = 'bg-transparent border-[1.5px] border-[#0a0a0a] text-black rounded-full px-6 py-2.5 font-semibold hover:bg-[#f2f2f2]'
      break
    case 'danger':
      styleClasses = 'bg-transparent border border-dashed border-[#0a0a0a] text-[#0a0a0a] rounded-full px-6 py-2.5 font-semibold italic hover:bg-[#f5f5f5]'
      break
    case 'icon':
      styleClasses = 'rounded-full w-9 h-9 border border-[#e0e0e0] bg-transparent hover:bg-[#f2f2f2] flex items-center justify-center'
      break
  }

  return (
    <button className={`${styleClasses} ${className}`} {...props} />
  )
}
