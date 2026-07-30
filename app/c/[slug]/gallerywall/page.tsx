import React from 'react'
import { notFound } from 'next/navigation'
import { getClubShowcaseData } from '@/lib/services/club-service'
import { GalleryWallClient } from '@/components/showcase/GalleryWallClient'

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

  const { club } = showcaseData
  return {
    title: `${club.name} | Gallery Wall`,
    description: `Auto-arranging photo and video gallery wall for ${club.name}.`
  }
}

export default async function ClubGalleryWallPage({ params }: PageProps) {
  const { slug } = await params
  const showcaseData = await getClubShowcaseData(slug)

  if (!showcaseData) {
    notFound()
  }

  return <GalleryWallClient data={showcaseData} />
}
