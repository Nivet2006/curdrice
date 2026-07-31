'use client'

import React from 'react'
import { ArrowUp, MapPin, Mail, Globe, GraduationCap } from 'lucide-react'
import { ShowcaseNavbar } from './ShowcaseNavbar'
import { ShowcaseHeroSection } from './ShowcaseHeroSection'
import { ShowcaseAboutSection } from './ShowcaseAboutSection'
import { ShowcaseMarqueeTicker } from './ShowcaseMarqueeTicker'
import { ShowcaseCollectiveSection } from './ShowcaseCollectiveSection'
import { ShowcaseEventsSection } from './ShowcaseEventsSection'
import { ShowcaseTeamSection } from './ShowcaseTeamSection'
import { ShowcaseGallerySection } from './ShowcaseGallerySection'
import { ShowcaseTestimonialsSection } from './ShowcaseTestimonialsSection'
import { ShowcaseBlogsSection } from './ShowcaseBlogsSection'
import { ShowcaseSurveysSection } from './ShowcaseSurveysSection'
import { ShowcaseToolsSection } from './ShowcaseToolsSection'
import { ShowcaseHistorySection } from './ShowcaseHistorySection'
import { ShowcaseContactSection } from './ShowcaseContactSection'
import { ShowcaseMotionBackground } from './ShowcaseMotionBackground'
import { ScrollProgressBar } from './motion/ScrollProgressBar'
import { GlobalScrollLineNetwork } from './motion/GlobalScrollLineNetwork'

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
  const primaryColor = themeConfig?.primaryColor || '#003C5E'
  const accentColor = themeConfig?.accentColor || '#FFB703'

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

  React.useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (!saved) {
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0D0D0F] text-[#111827] dark:text-[#F8F7F2] font-mono selection:bg-[#FFB703] selection:text-[#0D0D0F] transition-colors duration-200 relative">
      {/* Scroll Reading Progress Indicator */}
      <ScrollProgressBar />

      {/* Global Live Scroll-Drawn Circuit Lines */}
      <GlobalScrollLineNetwork />

      {/* Dynamic Framer Motion Background Effects */}
      <ShowcaseMotionBackground />

      {/* Sticky Navigation Bar */}
      <ShowcaseNavbar
        clubName={club.name}
        clubSlug={club.slug}
        logoUrl={config?.navbar_config?.logoUrl || club.logo_url}
        primaryColor={primaryColor}
        navbarConfig={config?.navbar_config}
      />

      {/* Main Content Flow */}
      <main className="relative z-10 space-y-4">
        {/* 1. Hero Section */}
        {sectionsEnabled.hero && (
          <ShowcaseHeroSection
            heroData={config?.hero_data}
            clubName={club.name}
            primaryColor={primaryColor}
            accentColor={accentColor}
          />
        )}

        {/* 2. Live Survey Promo Banner */}
        {sectionsEnabled.surveys && (
          <ShowcaseSurveysSection
            surveys={surveys}
            clubName={club.name}
            primaryColor={primaryColor}
          />
        )}

        {/* 3. What is [Club] & Why Join Us */}
        {sectionsEnabled.about && (
          <ShowcaseAboutSection
            aboutData={config?.about_data}
            clubName={club.name}
            primaryColor={primaryColor}
          />
        )}

        {/* 4. Framer Motion Infinite Marquee Ticker */}
        <ShowcaseMarqueeTicker primaryColor={primaryColor} />

        {/* 5. The Collective (Infrastructure Matrix 01 - 06) */}
        <ShowcaseCollectiveSection
          clubName={club.name}
          primaryColor={primaryColor}
        />

        {/* 6. Events Section */}
        {sectionsEnabled.events && (
          <ShowcaseEventsSection
            events={events}
            clubName={club.name}
            primaryColor={primaryColor}
          />
        )}

        {/* 7. Gallery Section */}
        {sectionsEnabled.gallery && gallery.length > 0 && (
          <ShowcaseGallerySection
            gallery={gallery}
            clubName={club.name}
            primaryColor={primaryColor}
          />
        )}

        {/* 8. Team Section */}
        {sectionsEnabled.team && (
          <ShowcaseTeamSection
            members={members}
            clubName={club.name}
            primaryColor={primaryColor}
          />
        )}

        {/* 9. Testimonials & Blogs */}
        {sectionsEnabled.testimonials && testimonials.length > 0 && (
          <ShowcaseTestimonialsSection
            testimonials={testimonials}
            clubName={club.name}
            primaryColor={primaryColor}
          />
        )}

        {sectionsEnabled.blogs && blogs.length > 0 && (
          <ShowcaseBlogsSection
            blogs={blogs}
            clubName={club.name}
            primaryColor={primaryColor}
          />
        )}

        {/* 10. Tools Suite */}
        {sectionsEnabled.tools && (
          <ShowcaseToolsSection
            tools={tools}
            clubName={club.name}
            primaryColor={primaryColor}
          />
        )}

        {/* 11. Website Contributor History */}
        <ShowcaseHistorySection
          clubName={club.name}
          primaryColor={primaryColor}
        />

        {/* 12. Contact Section */}
        {sectionsEnabled.contact && (
          <ShowcaseContactSection
            clubId={club.id}
            clubName={club.name}
            contactConfig={config?.contact_config}
            primaryColor={primaryColor}
          />
        )}
      </main>

      {/* Comprehensive 1% Club & Gopalan Skill Academy Footer */}
      <footer className="border-t border-[#E6E8EC] dark:border-white/10 bg-[#F7F8FA] dark:bg-[#15171A] pt-16 pb-12 text-[#6B7280] dark:text-[#B8BEC6] font-mono relative transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Club & Gopalan Skill Academy Branding */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2">
                {club.logo_url ? (
                  <img src={club.logo_url} alt={club.name} className="w-8 h-8 object-contain rounded-lg border border-zinc-200 dark:border-white/10" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-black font-mono text-xs text-white uppercase bg-[#003C5E]"
                  >
                    1%
                  </div>
                )}
                <span className="text-base font-black uppercase text-[#111827] dark:text-[#F8F7F2]">{club.name}</span>
              </div>

              <p className="text-xs text-[#6B7280] dark:text-[#B8BEC6] leading-relaxed">
                {club.name} at Gopalan Skill Academy. Building high-performance software and fostering engineering excellence.
              </p>

              <div className="flex items-center gap-1.5 text-xs text-[#003C5E] dark:text-[#FFB703] font-bold uppercase">
                <GraduationCap size={16} /> Gopalan Skill Academy Initiative
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-[#111827] dark:text-[#F8F7F2] tracking-widest">Explore</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#about" className="hover:text-[#003C5E] dark:hover:text-white transition-colors">About Us</a></li>
                <li><a href="#events" className="hover:text-[#003C5E] dark:hover:text-white transition-colors">Events &amp; Workshops</a></li>
                <li><a href="#team" className="hover:text-[#003C5E] dark:hover:text-white transition-colors">Executive Team</a></li>
                <li><a href="#surveys" className="hover:text-[#003C5E] dark:hover:text-white transition-colors">Surveys &amp; Feedback</a></li>
                <li><a href="#contact" className="hover:text-[#003C5E] dark:hover:text-white transition-colors">Contact Admin</a></li>
              </ul>
            </div>

            {/* Col 3: Tools Suite */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-[#111827] dark:text-[#F8F7F2] tracking-widest">Tools Suite</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#tools" className="hover:text-[#003C5E] dark:hover:text-white transition-colors">ATS Resume Checker</a></li>
                <li><a href="#tools" className="hover:text-[#003C5E] dark:hover:text-white transition-colors">VTU CGPA Calculator</a></li>
                <li><a href="#tools" className="hover:text-[#003C5E] dark:hover:text-white transition-colors">GitHub Profile Analyzer</a></li>
                <li><a href="#tools" className="hover:text-[#003C5E] dark:hover:text-white transition-colors">Career Roadmap Generator</a></li>
              </ul>
            </div>

            {/* Col 4: Campus Contact & Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-[#111827] dark:text-[#F8F7F2] tracking-widest">Contact</h4>
              <div className="space-y-2 text-xs">
                <p className="flex items-start gap-2">
                  <MapPin size={14} className="text-[#003C5E] dark:text-[#FFB703] shrink-0 mt-0.5" />
                  <span>Whitefield, Hoodi, Bangalore - 560048</span>
                </p>
                <p className="flex items-center gap-2">
                  <Globe size={14} className="text-[#003C5E] dark:text-[#FFB703] shrink-0" />
                  <a href="https://gopalan.ac.in" target="_blank" rel="noopener noreferrer" className="hover:underline">
                    Gopalan Skill Academy Official Website
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={14} className="text-[#003C5E] dark:text-[#FFB703] shrink-0" />
                  <span>{club.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}@gopalan.edu</span>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright, Center Logo, & Back To Top */}
          <div className="pt-8 border-t border-[#E6E8EC] dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>© {new Date().getFullYear()} Club Eve • Gopalan Skill Academy</p>

            <div className="flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Gopalan Skill Academy Logo"
                className="h-10 sm:h-12 w-auto object-contain hover:scale-105 transition-transform drop-shadow-md"
              />
            </div>

            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 px-4 py-2 bg-[#003C5E] hover:bg-[#002f4a] rounded-xl text-white font-bold uppercase text-[11px] transition-colors shadow"
            >
              <span>Back to Top</span>
              <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
