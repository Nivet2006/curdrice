'use client'

import React, { useState } from 'react'
import { Menu, X, Send, ChevronRight, GraduationCap } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import PatternPicker from '@/components/shared/PatternPicker'

interface ShowcaseNavbarProps {
  clubName: string
  clubSlug?: string
  logoUrl?: string | null
  primaryColor?: string
  navbarConfig?: any
}

export function ShowcaseNavbar({
  clubName,
  clubSlug,
  logoUrl,
  primaryColor = '#003C5E',
  navbarConfig
}: ShowcaseNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      const targetId = href.replace('#', '')
      const element = document.getElementById(targetId)

      if (element) {
        e.preventDefault()
        const headerOffset = 70
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.scrollY - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
        window.history.pushState(null, '', href)
      } else if (clubSlug) {
        e.preventDefault()
        window.location.href = `/c/${clubSlug}${href}`
      }
    }
    setMobileMenuOpen(false)
  }

  const galleryHref = clubSlug ? `/c/${clubSlug}/gallerywall` : '#gallery'

  const navLinks = [
    { label: 'HOME', href: '#home' },
    { label: 'ABOUT', href: '#about' },
    { label: 'EVENTS', href: '#events' },
    { label: 'TEAM', href: '#team' },
    { label: 'GALLERY', href: galleryHref },
    { label: 'BLOGS', href: '#blogs' },
    { label: 'SURVEY', href: '#surveys' },
    { label: 'TOOLS', href: '#tools' },
    { label: 'LOGIN', href: '/student/dashboard' }
  ]

  return (
    <header className="border-b border-[#E6E8EC] dark:border-white/10 bg-white/95 dark:bg-[#0D0D0F]/95 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200 text-[#111827] dark:text-[#F8F7F2]">
      <nav className="h-[72px] flex items-center justify-between px-4 md:px-8 w-full max-w-[1340px] mx-auto">
        {/* Left: Brand Mark + Club Logo & Title */}
        <div className="flex items-center gap-3">
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, '#home')}
            className="flex items-center gap-3 group min-w-0"
          >
            {logoUrl ? (
              <img src={logoUrl} alt={clubName} className="w-9 h-9 object-contain rounded-xl shrink-0 shadow-md border border-zinc-200 dark:border-white/10" />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black font-mono text-[9px] leading-tight text-white shadow-md uppercase shrink-0 bg-[#003C5E] text-center p-0.5"
              >
                The One Percent
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-base font-black uppercase tracking-tight text-[#111827] dark:text-[#F8F7F2] group-hover:text-[#003C5E] dark:group-hover:text-[#FFB703] transition-colors truncate">
                {navbarConfig?.title || clubName}
              </span>
              <span className="text-[10px] font-mono font-semibold text-[#6B7280] dark:text-[#B8BEC6] flex items-center gap-1">
                <GraduationCap size={11} className="text-[#003C5E] dark:text-[#FFB703]" /> Gopalan Skill Academy
              </span>
            </div>
          </a>
        </div>

        {/* Center: Showcase Section Links */}
        <div className="hidden lg:flex items-center gap-1 bg-[#F7F8FA] dark:bg-[#15171A] border border-[#E6E8EC] dark:border-white/10 rounded-full px-3.5 py-1.5 shadow-inner">
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#B8BEC6] hover:text-white dark:hover:text-[#F8F7F2] hover:bg-[#003C5E] rounded-full transition-all"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right: ThemeToggle + PatternPicker + Sunset Glow CTA */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <PatternPicker />

          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, '#contact')}
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-white bg-[#E85D04] hover:bg-[#d05303] shadow-lg shadow-[#E85D04]/20 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <Send size={12} /> Contact
          </a>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#6B7280] dark:text-[#B8BEC6] hover:text-[#111827] dark:hover:text-white rounded-xl border border-[#E6E8EC] dark:border-white/10 bg-[#F7F8FA] dark:bg-[#15171A]"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-[#0D0D0F] border-b border-[#E6E8EC] dark:border-white/10 px-6 py-6 space-y-4 animate-in slide-in-from-top duration-200">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-4 py-3 bg-[#F7F8FA] dark:bg-[#15171A] rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#111827] dark:text-[#F8F7F2] flex items-center justify-between border border-[#E6E8EC] dark:border-white/5"
              >
                <span>{link.label}</span>
                <ChevronRight size={14} className="text-[#003C5E] dark:text-[#FFB703]" />
              </a>
            ))}
          </div>
          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, '#contact')}
            className="w-full py-3.5 rounded-xl text-xs font-mono font-bold uppercase tracking-widest text-white text-center block shadow-lg bg-[#E85D04]"
          >
            Contact Club Admin
          </a>
        </div>
      )}
    </header>
  )
}
