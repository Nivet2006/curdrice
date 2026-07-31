import React from 'react'
import { OnePercentSplash } from '@/components/splash/OnePercentSplash'

export default function OnePercentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OnePercentSplash />
      {children}
    </>
  )
}
