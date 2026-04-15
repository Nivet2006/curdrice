import React from 'react'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`rounded-xl border border-[#d0d0d0] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:ring-offset-0 placeholder:text-[#999999] font-sans ${className}`}
          {...props}
        />
        {error && <span className="text-xs font-mono text-[#0a0a0a]">{error}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'
