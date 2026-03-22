'use client'

import React, { useState } from 'react'
import { QRDisplay } from './QRDisplay'

type QRButtonProps = {
  token: string
  studentName: string
  usn: string
  eventName: string
  className?: string
  children?: React.ReactNode
}

export function QRButton({ token, studentName, usn, eventName, className, children }: QRButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(true)
        }}
        className={className || "block w-full text-center mt-3 border-[1.5px] border-[#0a0a0a] text-black rounded-full px-6 py-2.5 font-semibold hover:bg-[#f2f2f2] text-sm transition-colors"}
      >
        {children || "View QR Code →"}
      </button>

      {isOpen && (
        <QRDisplay 
          token={token}
          studentName={studentName}
          usn={usn}
          eventName={eventName}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
