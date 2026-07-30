'use client'

import React from 'react'
import { ShowcaseNavbar } from './ShowcaseNavbar'
import { ShowcaseHeroSection } from './ShowcaseHeroSection'
import { ShowcaseAboutSection } from './ShowcaseAboutSection'
import { ShowcaseEventsSection } from './ShowcaseEventsSection'
import { ShowcaseTeamSection } from './ShowcaseTeamSection'
import { ShowcaseGallerySection } from './ShowcaseGallerySection'
import { ShowcaseTestimonialsSection } from './ShowcaseTestimonialsSection'
import { ShowcaseBlogsSection } from './ShowcaseBlogsSection'
import { ShowcaseSurveysSection } from './ShowcaseSurveysSection'
import { ShowcaseToolsSection } from './ShowcaseToolsSection'
import { ShowcaseContactSection } from './ShowcaseContactSection'

interface PublicShowcaseClientProps {
  data: {
    club: any
    config: any
    testimonials: any[]
    gallery: any[]
    blogs: any[]
    tools: any[]
    surveys: any[]
    events: any[]
    members: any[]
  }
}

export function PublicShowcaseClient({ data }: PublicShowcaseClientProps) {
  const { club, config, testimonials, gallery, blogs, tools, surveys, events, members } = data

  const themeConfig = config?.theme_config || {}
  const primaryColor = themeConfig?.primaryColor || '#f59e0b'
  const accentColor = themeConfig?.accentColor || '#3b82f6'

  const sectionsOrder: string[] = (config?.sections_order || [
    'hero',
    'about',
    'events',
    'team',
    'testimonials',
    'blogs',
    'surveys',
    'tools',
    'contact'
  ]).filter((s: string) => s !== 'gallery')

  const sectionsEnabled = config?.sections_enabled || {
    hero: true,
    about: true,
    events: true,
    team: true,
    gallery: true,
    testimonials: true,
    blogs: true,
    surveys: true,
    tools: true,
    contact: true
  }

  const renderSection = (sectionKey: string) => {
    if (!sectionsEnabled[sectionKey]) return null

    switch (sectionKey) {
      case 'hero':
        return (
          <ShowcaseHeroSection
            key="hero"
            heroData={config?.hero_data}
            clubName={club.name}
            primaryColor={primaryColor}
            accentColor={accentColor}
          />
        )

      case 'about':
        return (
          <ShowcaseAboutSection
            key="about"
            aboutData={config?.about_data}
            clubName={club.name}
            primaryColor={primaryColor}
          />
        )

      case 'events':
        return (
          <ShowcaseEventsSection
            key="events"
            events={events}
            clubName={club.name}
            primaryColor={primaryColor}
          />
        )

      case 'team':
        return (
          <ShowcaseTeamSection
            key="team"
            members={members}
            clubName={club.name}
            primaryColor={primaryColor}
          />
        )

      case 'gallery':
        return (
          <ShowcaseGallerySection
            key="gallery"
            gallery={gallery}
            clubName={club.name}
            primaryColor={primaryColor}
          />
        )

      case 'testimonials':
        return (
          <ShowcaseTestimonialsSection
            key="testimonials"
            testimonials={testimonials}
            clubName={club.name}
            primaryColor={primaryColor}
          />
        )

      case 'blogs':
        return (
          <ShowcaseBlogsSection
            key="blogs"
            blogs={blogs}
            clubName={club.name}
            primaryColor={primaryColor}
          />
        )

      case 'surveys':
        return (
          <ShowcaseSurveysSection
            key="surveys"
            surveys={surveys}
            clubName={club.name}
            primaryColor={primaryColor}
          />
        )

      case 'tools':
        return (
          <ShowcaseToolsSection
            key="tools"
            tools={tools}
            clubName={club.name}
            primaryColor={primaryColor}
          />
        )

      case 'contact':
        return (
          <ShowcaseContactSection
            key="contact"
            clubId={club.id}
            clubName={club.name}
            contactConfig={config?.contact_config}
            primaryColor={primaryColor}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-zinc-900 dark:text-white font-mono selection:bg-amber-400 selection:text-black">
      {/* Sticky Dashboard-Style Header with ThemeToggle and PatternPicker */}
      <ShowcaseNavbar
        clubName={club.name}
        clubSlug={club.slug}
        logoUrl={config?.navbar_config?.logoUrl}
        primaryColor={primaryColor}
        navbarConfig={config?.navbar_config}
      />

      {/* Render Dynamic Sections in Configured Order */}
      <main className="relative z-10">
        {sectionsOrder.map(sectionKey => renderSection(sectionKey))}
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs font-mono text-zinc-500 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
        <p>© {new Date().getFullYear()} {club.name} • Powered by Curdrice Platform</p>
      </footer>
    </div>
  )
}
