'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Sparkles, Send, ChevronRight } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import PatternPicker from '@/components/shared/PatternPicker'

interface ShowcaseNavbarProps {
  clubName: string
  clubSlug?: string
  logoUrl?: string | null
  primaryColor?: string
  navbarConfig?: any
}

export function ShowcaseNavbar({ clubName, clubSlug, logoUrl, primaryColor = '#f59e0b', navbarConfig }: ShowcaseNavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
    { label: 'TOOLS', href: '#tools' }
  ]

  return (
    <header className="border-b border-[#e0e0e0] dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-50 transition-all duration-200">
      <nav className="h-[60px] flex items-center justify-between px-4 md:px-8 w-full max-w-[1280px] mx-auto">
        {/* Left: Brand Mark + Club Logo & Title */}
        <div className="flex items-center gap-4">
          <Link href="/" className="font-mono font-bold text-[#0a0a0a] dark:text-white flex items-center gap-1">
            <span className="text-amber-500 font-bold">{'>'}</span> Club-Eve
          </Link>
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, '#home')}
            className="flex items-center gap-2.5 group min-w-0"
          >
            {logoUrl ? (
              <img src={logoUrl} alt={clubName} className="w-7 h-7 object-contain rounded-lg shrink-0" />
            ) : (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-black font-mono text-xs text-black shadow-sm uppercase shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {clubName.charAt(0)}
              </div>
            )}
            <span className="text-sm font-bold uppercase tracking-tight text-zinc-900 dark:text-white group-hover:text-amber-500 transition-colors truncate">
              {navbarConfig?.title || clubName}
            </span>
          </a>
        </div>

        {/* Center: Showcase Section Links */}
        <div className="hidden lg:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 rounded-full px-3 py-1">
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-full transition-all"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right: ThemeToggle + PatternPicker + Contact CTA */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <PatternPicker />

          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, '#contact')}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-black shadow-sm transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: primaryColor }}
          >
            <Send size={12} /> Contact
          </a>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-lg border border-zinc-200 dark:border-zinc-800"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 px-6 py-6 space-y-4 animate-in slide-in-from-top duration-200">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center justify-between"
              >
                <span>{link.label}</span>
                <ChevronRight size={14} className="text-zinc-400" />
              </a>
            ))}
          </div>
          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, '#contact')}
            className="w-full py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-widest text-black text-center block shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            Contact Club Admin
          </a>
        </div>
      )}
    </header>
  )
}
