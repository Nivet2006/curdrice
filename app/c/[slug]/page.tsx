import React from 'react'
import { notFound } from 'next/navigation'
import { getClubShowcaseData } from '@/lib/services/club-service'
import { PublicShowcaseClient } from '@/components/showcase/PublicShowcaseClient'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const showcaseData = await getClubShowcaseData(slug)
  if (!showcaseData) {
    return {
      title: 'Club Showcase Not Found'
    }
  }

  const { club, config } = showcaseData
  return {
    title: `${club.name} | Public Showcase`,
    description: config?.hero_data?.subtitle || club.description || `Official public showcase page for ${club.name}.`
  }
}

export default async function ClubShowcasePage({ params }: PageProps) {
  const { slug } = await params
  const showcaseData = await getClubShowcaseData(slug)

  if (!showcaseData) {
    notFound()
  }

  return <PublicShowcaseClient data={showcaseData} />
}
