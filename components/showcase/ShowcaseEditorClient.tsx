'use client'

import React, { useState, useEffect } from 'react'
import {
  getClubs,
  getClubShowcaseData,
  updateClubSlugAction,
  assignClubAdminAction,
  updateShowcaseConfigAction,
  addTestimonialAction,
  deleteTestimonialAction,
  addGalleryImageAction,
  deleteGalleryImageAction,
  addBlogArticleAction,
  deleteBlogArticleAction,
  addToolItemAction,
  deleteToolItemAction,
  addSurveyItemAction,
  deleteSurveyItemAction,
  getClubInquiriesAction
} from '@/lib/actions/club-actions'
import { getClubPublicUrl } from '@/lib/utils/club-url'
import {
  Settings,
  Palette,
  Eye,
  MoveUp,
  MoveDown,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  Mail,
  Shield,
  Layers,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface ShowcaseEditorClientProps {
  initialClubs: any[]
  userRole: string
  userId: string
}

export function ShowcaseEditorClient({ initialClubs, userRole, userId }: ShowcaseEditorClientProps) {
  const [clubs, setClubs] = useState<any[]>(initialClubs)
  const [selectedClub, setSelectedClub] = useState<any>(initialClubs[0] || null)

  // Full Showcase Data State
  const [loading, setLoading] = useState(false)
  const [showcaseData, setShowcaseData] = useState<any>(null)

  // Active Editor Tab
  const [activeTab, setActiveTab] = useState<'slug' | 'theme' | 'sections' | 'content' | 'inquiries'>('slug')

  // Form States
  const [slug, setSlug] = useState('')
  const [assignedAdminId, setAssignedAdminId] = useState('')
  const [savingSlug, setSavingSlug] = useState(false)

  // Theme & Sections Config
  const [primaryColor, setPrimaryColor] = useState('#f59e0b')
  const [accentColor, setAccentColor] = useState('#3b82f6')
  const [sectionsOrder, setSectionsOrder] = useState<string[]>([])
  const [sectionsEnabled, setSectionsEnabled] = useState<any>({})

  // Content JSON Data States
  const [heroData, setHeroData] = useState<any>({})
  const [aboutData, setAboutData] = useState<any>({})
  const [contactConfig, setContactConfig] = useState<any>({})

  // Lists & Inquiries
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [gallery, setGallery] = useState<any[]>([])
  const [blogs, setBlogs] = useState<any[]>([])
  const [tools, setTools] = useState<any[]>([])
  const [surveys, setSurveys] = useState<any[]>([])
  const [inquiries, setInquiries] = useState<any[]>([])

  // Modal / Add item states
  const [newTestimonial, setNewTestimonial] = useState({ author_name: '', author_role: '', quote: '', avatar_url: '', rating: 5 })
  const [newGallery, setNewGallery] = useState({ image_url: '', title: '', category: 'General', caption: '' })
  const [newBlog, setNewBlog] = useState({ title: '', cover_image: '', excerpt: '', content: '', author_name: '' })
  const [newTool, setNewTool] = useState({ title: '', description: '', url: '', category: 'Resource' })
  const [newSurvey, setNewSurvey] = useState({ title: '', description: '', form_url: '' })

  const [savingConfig, setSavingConfig] = useState(false)

  // Load Showcase details when selected club changes
  async function loadShowcase(clubObj: any) {
    if (!clubObj) return
    setLoading(true)
    const res = await getClubShowcaseData(clubObj.id)
    setLoading(false)

    if (res.error) {
      toast.error(res.error)
      return
    }

    if (res.data) {
      const { club, config, testimonials, gallery, blogs, tools, surveys } = res.data
      setShowcaseData(res.data)
      setSlug(club.slug || club.id)
      setAssignedAdminId(club.assigned_admin_id || '')

      const theme = config?.theme_config || {}
      setPrimaryColor(theme.primaryColor || '#f59e0b')
      setAccentColor(theme.accentColor || '#3b82f6')

      setSectionsOrder(
        config?.sections_order || ['hero', 'about', 'events', 'team', 'gallery', 'testimonials', 'blogs', 'surveys', 'tools', 'contact']
      )
      setSectionsEnabled(
        config?.sections_enabled || {
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
      )

      setHeroData(config?.hero_data || {})
      setAboutData(config?.about_data || {})
      setContactConfig(config?.contact_config || {})

      setTestimonials(testimonials || [])
      setGallery(gallery || [])
      setBlogs(blogs || [])
      setTools(tools || [])
      setSurveys(surveys || [])

      // Fetch inquiries
      loadInquiries(club.id)
    }
  }

  async function loadInquiries(clubId: string) {
    const res = await getClubInquiriesAction(clubId)
    if (res.inquiries) setInquiries(res.inquiries)
  }

  useEffect(() => {
    if (selectedClub) {
      loadShowcase(selectedClub)
    }
  }, [selectedClub])

  /* Handle Slug Save */
  async function handleSaveSlug(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClub || !slug.trim()) return

    setSavingSlug(true)
    const res = await updateClubSlugAction(selectedClub.id, slug)
    setSavingSlug(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(`URL Slug updated! Live at /c/${res.slug}`)
      setSelectedClub({ ...selectedClub, slug: res.slug })
    }
  }

  /* Handle Admin Assignment */
  async function handleAssignAdmin(profileId: string) {
    if (!selectedClub) return
    const res = await assignClubAdminAction(selectedClub.id, profileId || null)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Showcase Admin assigned successfully.')
      setAssignedAdminId(profileId)
    }
  }

  /* Save Full Configuration */
  async function handleSaveConfig() {
    if (!selectedClub) return

    setSavingConfig(true)
    const res = await updateShowcaseConfigAction(selectedClub.id, {
      theme_config: { primaryColor, accentColor, darkTheme: true, fontFamily: 'mono' },
      sections_order: sectionsOrder,
      sections_enabled: sectionsEnabled,
      hero_data: heroData,
      about_data: aboutData,
      contact_config: contactConfig
    })
    setSavingConfig(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Showcase Page Configuration Saved!')
    }
  }

  /* Section Reordering */
  function moveSection(index: number, direction: 'up' | 'down') {
    const newOrder = [...sectionsOrder]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newOrder.length) return
    const temp = newOrder[index]
    newOrder[index] = newOrder[targetIndex]
    newOrder[targetIndex] = temp
    setSectionsOrder(newOrder)
  }

  function toggleSectionEnabled(key: string) {
    setSectionsEnabled({
      ...sectionsEnabled,
      [key]: !sectionsEnabled[key]
    })
  }

  /* Item Handlers */
  async function handleAddTestimonial(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClub || !newTestimonial.author_name || !newTestimonial.quote) return
    const res = await addTestimonialAction(selectedClub.id, newTestimonial)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Testimonial added!')
      setNewTestimonial({ author_name: '', author_role: '', quote: '', avatar_url: '', rating: 5 })
      loadShowcase(selectedClub)
    }
  }

  async function handleDeleteTestimonial(id: string) {
    const res = await deleteTestimonialAction(id)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Deleted testimonial.')
      loadShowcase(selectedClub)
    }
  }

  async function handleAddGallery(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClub || !newGallery.image_url) return
    const res = await addGalleryImageAction(selectedClub.id, newGallery)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Gallery image added!')
      setNewGallery({ image_url: '', title: '', category: 'General', caption: '' })
      loadShowcase(selectedClub)
    }
  }

  async function handleDeleteGallery(id: string) {
    const res = await deleteGalleryImageAction(id)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Deleted gallery image.')
      loadShowcase(selectedClub)
    }
  }

  async function handleAddBlog(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClub || !newBlog.title || !newBlog.content) return
    const res = await addBlogArticleAction(selectedClub.id, newBlog)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Blog article published!')
      setNewBlog({ title: '', cover_image: '', excerpt: '', content: '', author_name: '' })
      loadShowcase(selectedClub)
    }
  }

  async function handleDeleteBlog(id: string) {
    const res = await deleteBlogArticleAction(id)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Deleted blog post.')
      loadShowcase(selectedClub)
    }
  }

  async function handleAddTool(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClub || !newTool.title || !newTool.url) return
    const res = await addToolItemAction(selectedClub.id, newTool)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Resource tool added!')
      setNewTool({ title: '', description: '', url: '', category: 'Resource' })
      loadShowcase(selectedClub)
    }
  }

  async function handleDeleteTool(id: string) {
    const res = await deleteToolItemAction(id)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Deleted tool resource.')
      loadShowcase(selectedClub)
    }
  }

  async function handleAddSurvey(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClub || !newSurvey.title || !newSurvey.form_url) return
    const res = await addSurveyItemAction(selectedClub.id, newSurvey)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Survey added!')
      setNewSurvey({ title: '', description: '', form_url: '' })
      loadShowcase(selectedClub)
    }
  }

  async function handleDeleteSurvey(id: string) {
    const res = await deleteSurveyItemAction(id)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Deleted survey.')
      loadShowcase(selectedClub)
    }
  }

  return (
    <div className="space-y-8 bg-zinc-950 text-white min-h-screen p-6 md:p-8 rounded-[2.5rem] border border-zinc-800">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Sparkles className="text-amber-400" />
            Public Showcase Builder
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Customize 100% of your club's public page, URL slug, themes, sections, and showcase content.
          </p>
        </div>

        {/* Club Picker Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-mono uppercase text-zinc-400 font-bold">Select Club:</label>
          <select
            value={selectedClub?.id || ''}
            onChange={e => {
              const found = clubs.find(c => c.id === e.target.value)
              if (found) setSelectedClub(found)
            }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white outline-none focus:border-amber-400"
          >
            {clubs.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {selectedClub && (
            <Link
              href={getClubPublicUrl(selectedClub)}
              target="_blank"
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all"
            >
              <Eye size={14} /> Live Showcase
            </Link>
          )}
        </div>
      </div>

      {/* Editor Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
        {[
          { id: 'slug', label: 'URL Slug & Admin', icon: <LinkIcon size={14} /> },
          { id: 'theme', label: 'Theme & Colors', icon: <Palette size={14} /> },
          { id: 'sections', label: 'Sections & Order', icon: <Layers size={14} /> },
          { id: 'content', label: 'Element Content Editor', icon: <Settings size={14} /> },
          { id: 'inquiries', label: `Inbox (${inquiries.length})`, icon: <Mail size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-amber-500 text-black shadow-lg'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SLUG & ADMIN MANAGEMENT */}
      {activeTab === 'slug' && selectedClub && (
        <div className="space-y-8 max-w-3xl">
          <form onSubmit={handleSaveSlug} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold uppercase text-sm">
              <LinkIcon size={16} /> Custom URL Slug (`./$THIS_NAME_CAN_BE_CUSTOMISED`)
            </div>
            <p className="text-xs font-mono text-zinc-400 leading-relaxed">
              Define the public web URL path slug for {selectedClub.name}. Updating this slug will instantly update all links across the website.
            </p>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-zinc-500 bg-zinc-950 px-3 py-3 rounded-xl border border-zinc-800">
                curdrice.app/c/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="e.g. robotics, techeon"
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={savingSlug}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-50"
              >
                {savingSlug ? 'Saving...' : 'Save Slug'}
              </button>
            </div>

            <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 pt-1">
              <CheckCircle2 size={12} /> Live Route Target: {getClubPublicUrl({ id: selectedClub.id, slug })}
            </div>
          </form>

          {/* Assigned Admin Selection */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold uppercase text-sm">
              <Shield size={16} /> Showcase Admin Delegation
            </div>
            <p className="text-xs font-mono text-zinc-400">
              Assign a specific user/coordinator as the designated Showcase Admin for this club page.
            </p>

            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Enter User Profile ID..."
                value={assignedAdminId}
                onChange={e => setAssignedAdminId(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none"
              />
              <button
                onClick={() => handleAssignAdmin(assignedAdminId)}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl"
              >
                Assign Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: THEME & COLOR CUSTOMIZER */}
      {activeTab === 'theme' && (
        <div className="space-y-8 max-w-3xl">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-6">
            <h3 className="text-base font-bold font-mono uppercase text-white">Showcase Color Palette</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-zinc-400 font-bold">Primary Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="w-12 h-10 bg-transparent cursor-pointer rounded-lg border border-zinc-800"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-zinc-400 font-bold">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    className="w-12 h-10 bg-transparent cursor-pointer rounded-lg border border-zinc-800"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2"
            >
              <Save size={14} /> Save Theme Settings
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SECTIONS ORDER & VISIBILITY */}
      {activeTab === 'sections' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
            <h3 className="text-base font-bold font-mono uppercase text-white">Reorder &amp; Toggle Sections</h3>
            <p className="text-xs font-mono text-zinc-400">
              Drag or use position controls to change section order on the public showcase page.
            </p>

            <div className="space-y-3 pt-2">
              {sectionsOrder.map((sectionKey, index) => (
                <div
                  key={sectionKey}
                  className="flex items-center justify-between bg-zinc-950 border border-zinc-800 p-4 rounded-2xl"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-zinc-500 font-bold">#{index + 1}</span>
                    <span className="text-sm font-bold font-mono uppercase text-white">{sectionKey}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleSectionEnabled(sectionKey)}
                      className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                        sectionsEnabled[sectionKey]
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}
                    >
                      {sectionsEnabled[sectionKey] ? 'Enabled' : 'Hidden'}
                    </button>

                    {/* Up / Down Buttons */}
                    <button
                      onClick={() => moveSection(index, 'up')}
                      disabled={index === 0}
                      className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 rounded-xl"
                    >
                      <MoveUp size={14} />
                    </button>
                    <button
                      onClick={() => moveSection(index, 'down')}
                      disabled={index === sectionsOrder.length - 1}
                      className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 rounded-xl"
                    >
                      <MoveDown size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 mt-4"
            >
              <Save size={14} /> Save Layout &amp; Order
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: ELEMENT CONTENT EDITORS */}
      {activeTab === 'content' && (
        <div className="space-y-8 max-w-4xl">
          {/* Hero Editor */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold font-mono uppercase text-amber-400">1. Hero Section Content</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Hero Title</label>
                <input
                  type="text"
                  value={heroData.title || ''}
                  onChange={e => setHeroData({ ...heroData, title: e.target.value })}
                  placeholder="e.g. Techeon Hub"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Tagline Badge</label>
                <input
                  type="text"
                  value={heroData.tagline || ''}
                  onChange={e => setHeroData({ ...heroData, tagline: e.target.value })}
                  placeholder="e.g. OFFICIAL SHOWCASE"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white outline-none"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Subtitle</label>
                <textarea
                  rows={2}
                  value={heroData.subtitle || ''}
                  onChange={e => setHeroData({ ...heroData, subtitle: e.target.value })}
                  placeholder="Enter punchy intro sentence..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white outline-none resize-none"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Banner Background Image URL</label>
                <input
                  type="text"
                  value={heroData.bannerUrl || ''}
                  onChange={e => setHeroData({ ...heroData, bannerUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Testimonials Manager */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-6">
            <h3 className="text-lg font-bold font-mono uppercase text-amber-400">2. Testimonials Manager</h3>

            <form onSubmit={handleAddTestimonial} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <input
                type="text"
                required
                placeholder="Author Name (e.g. Alex Smith)"
                value={newTestimonial.author_name}
                onChange={e => setNewTestimonial({ ...newTestimonial, author_name: e.target.value })}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono text-white outline-none"
              />
              <input
                type="text"
                required
                placeholder="Author Role (e.g. Vice President, 2025)"
                value={newTestimonial.author_role}
                onChange={e => setNewTestimonial({ ...newTestimonial, author_role: e.target.value })}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono text-white outline-none"
              />
              <textarea
                required
                rows={2}
                placeholder="Testimonial Quote..."
                value={newTestimonial.quote}
                onChange={e => setNewTestimonial({ ...newTestimonial, quote: e.target.value })}
                className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono text-white outline-none resize-none"
              />
              <button
                type="submit"
                className="md:col-span-2 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Add Testimonial
              </button>
            </form>

            <div className="space-y-2">
              {testimonials.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-xs font-mono">
                  <div>
                    <span className="font-bold text-white uppercase">{item.author_name}</span> ({item.author_role})
                    <p className="text-zinc-400 italic font-mono mt-1">"{item.quote}"</p>
                  </div>
                  <button onClick={() => handleDeleteTestimonial(item.id)} className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-xl">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Gallery Manager */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-6">
            <h3 className="text-lg font-bold font-mono uppercase text-amber-400">3. Gallery Photos</h3>

            <form onSubmit={handleAddGallery} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <input
                type="text"
                required
                placeholder="Image URL (https://...)"
                value={newGallery.image_url}
                onChange={e => setNewGallery({ ...newGallery, image_url: e.target.value })}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono text-white outline-none"
              />
              <input
                type="text"
                placeholder="Category (e.g. Hackathon, Workshop)"
                value={newGallery.category}
                onChange={e => setNewGallery({ ...newGallery, category: e.target.value })}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono text-white outline-none"
              />
              <input
                type="text"
                placeholder="Photo Title"
                value={newGallery.title}
                onChange={e => setNewGallery({ ...newGallery, title: e.target.value })}
                className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono text-white outline-none"
              />
              <button
                type="submit"
                className="md:col-span-2 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Add Photo
              </button>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {gallery.map(item => (
                <div key={item.id} className="relative group bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 h-28">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleDeleteGallery(item.id)}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveConfig}
            disabled={savingConfig}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-xl"
          >
            <Save size={16} /> Save All Element Content Changes
          </button>
        </div>
      )}

      {/* TAB 5: PUBLIC INQUIRIES INBOX */}
      {activeTab === 'inquiries' && (
        <div className="space-y-6 max-w-4xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold font-mono uppercase text-white">Public Inquiries Inbox</h3>
            <span className="text-xs font-mono text-zinc-400">{inquiries.length} Messages</span>
          </div>

          {inquiries.length > 0 ? (
            <div className="space-y-4">
              {inquiries.map(item => (
                <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-3 shadow-lg">
                  <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
                    <div>
                      <h4 className="text-sm font-bold font-mono text-white uppercase">{item.sender_name}</h4>
                      <p className="text-xs font-mono text-amber-400">{item.sender_email}</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>

                  {item.subject && (
                    <p className="text-xs font-mono font-bold text-zinc-300">Subject: {item.subject}</p>
                  )}

                  <p className="text-xs font-mono text-zinc-300 leading-relaxed bg-zinc-950 p-4 rounded-2xl border border-zinc-850">
                    {item.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
              <Mail size={36} className="mx-auto text-zinc-600 mb-2" />
              <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
                No inquiry messages received yet
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
