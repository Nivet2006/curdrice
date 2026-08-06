import React from 'react'
import { OnePercentSplash } from '@/components/splash/OnePercentSplash'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{
    slug: string
  }>
}

export default async function ShowcaseLayout({ children, params }: LayoutProps) {
  const { slug } = await params
  const isOnePercent = slug === 'onepercent' || slug === '1percent'

  return (
    <>
      {isOnePercent && <OnePercentSplash />}
      {children}
    </>
  )
}
