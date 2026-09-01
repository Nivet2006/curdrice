'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users,
  Plus,
  QrCode,
  Link2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Edit,
  Sparkles,
  ArrowLeft,
  Search,
  ShieldCheck
} from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { Navbar } from '@/components/shared/Navbar'
import { getTedxPortfolios, createTedxPortfolio, updateTedxPortfolio, TedxPortfolio } from '@/lib/actions/tedx'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function AdminTedxPage() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [name, setName] = useState<string>('')
  const [portfolios, setPortfolios] = useState<TedxPortfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<TedxPortfolio>>({
    display_name: '',
    slug: '',
    role: 'Core Crew',
    team_name: 'TEDxGCEM Operations',
    year: 2026,
    is_active: true,
    is_public: true,
    bio: '',
    profile_photo_url: '',
    social_links: { linkedin: '', twitter: '', github: '' }
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single()

        if (profile) {
          setRole(profile.role)
          setName(profile.full_name)
        }
      }

      const list = await getTedxPortfolios()
      setPortfolios(list)
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.display_name || !formData.slug || !formData.role) {
      toast.error('Display Name, Slug, and Role are required.')
      return
    }

    setSubmitting(true)
    const cleanSlug = formData.slug.toLowerCase().trim().replace(/\s+/g, '-')

    if (editingId) {
      const res = await updateTedxPortfolio(editingId, { ...formData, slug: cleanSlug })
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('TEDx Portfolio updated!')
        setIsModalOpen(false)
        const updatedList = await getTedxPortfolios()
        setPortfolios(updatedList)
      }
    } else {
      const res = await createTedxPortfolio({ ...formData, slug: cleanSlug })
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('TEDx Portfolio created!')
        setIsModalOpen(false)
        const updatedList = await getTedxPortfolios()
        setPortfolios(updatedList)
      }
    }
    setSubmitting(false)
  }

  const openCreateModal = () => {
    setEditingId(null)
    setFormData({
      display_name: '',
      slug: '',
      role: 'Core Crew',
      team_name: 'TEDxGCEM Operations',
      year: 2026,
      is_active: true,
      is_public: true,
      bio: '',
      profile_photo_url: '',
      social_links: { linkedin: '', twitter: '', github: '' }
    })
    setIsModalOpen(true)
  }

  const openEditModal = (item: TedxPortfolio) => {
    setEditingId(item.id)
    setFormData({
      display_name: item.display_name,
      slug: item.slug,
      role: item.role,
      team_name: item.team_name || 'TEDxGCEM Operations',
      year: item.year || 2026,
      is_active: item.is_active,
      is_public: item.is_public,
      bio: item.bio || '',
      profile_photo_url: item.profile_photo_url || '',
      social_links: item.social_links || { linkedin: '', twitter: '', github: '' }
    })
    setIsModalOpen(true)
  }

  const filteredPortfolios = portfolios.filter(p =>
    p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.team_name && p.team_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] transition-colors duration-200">
      {role === 'admin' ? (
        <AdminHeader role="admin" name={name || undefined} />
      ) : (
        <Navbar role={role as any || undefined} name={name || undefined} />
      )}

      <main className="max-w-[1280px] mx-auto px-4 md:px-8 py-10 space-y-8">
        {/* Page Header Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border)] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="p-2 rounded-xl bg-red-500/10 text-red-500 font-mono text-xs font-bold flex items-center gap-1.5">
                <Sparkles size={16} /> TEDxGCEM Dynamic QR & Portfolios
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--fg)]">
              TEDx Crew Portfolios
            </h1>
            <p className="text-xs font-mono text-[var(--fg-muted)] mt-1">
              Manage dynamic identities and generate scannable branded QR codes for TEDxGCEM crew members.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/qr"
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--fg)] text-xs font-mono font-bold flex items-center gap-2 transition-all"
            >
              <QrCode size={16} /> QR Studio
            </Link>
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus size={16} /> Add TEDx Crew Profile
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-2xl">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-3 text-[var(--fg-muted)]" />
            <input
              type="text"
              placeholder="Search by name, role, team, or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-subtle)] border border-[var(--border)] text-xs font-mono rounded-xl focus:outline-none focus:border-[var(--fg)]"
            />
          </div>
          <span className="font-mono text-xs text-[var(--fg-muted)] font-bold">
            Total Profiles: {filteredPortfolios.length}
          </span>
        </div>

        {/* Profiles Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border)] font-mono text-[10px] uppercase text-[var(--fg-muted)] tracking-wider">
                  <th className="p-4">Crew Member</th>
                  <th className="p-4">Role & Team</th>
                  <th className="p-4">Target Stable Route</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center font-mono text-xs text-[var(--fg-muted)] animate-pulse">
                      Loading TEDx Crew Portfolios...
                    </td>
                  </tr>
                ) : filteredPortfolios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center font-mono text-xs text-[var(--fg-muted)]">
                      No TEDx crew portfolios found. Click "Add TEDx Crew Profile" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredPortfolios.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--bg-subtle)]/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {item.profile_photo_url ? (
                            <img
                              src={item.profile_photo_url}
                              alt={item.display_name}
                              className="w-9 h-9 rounded-full object-cover border border-[var(--border)]"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-red-500/10 text-red-500 font-bold font-mono flex items-center justify-center text-sm border border-red-500/20">
                              {item.display_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-[var(--fg)] leading-snug">{item.display_name}</p>
                            <p className="font-mono text-[10px] text-[var(--fg-muted)]">/tedx/{item.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-[var(--fg)]">{item.role}</p>
                        <p className="font-mono text-[10px] text-[var(--fg-muted)]">{item.team_name || 'TEDxGCEM Crew'} ({item.year || 2026})</p>
                      </td>
                      <td className="p-4 font-mono text-[11px]">
                        <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg)]">
                          https://clubeve.nivet2006.in/tedx/{item.slug}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            item.is_active ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                          }`}
                        >
                          {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/qr?slug=${item.slug}&logo=tedx`}
                            className="px-2.5 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl font-mono text-[10px] font-bold flex items-center gap-1"
                          >
                            <QrCode size={13} /> Launch QR Studio
                          </Link>
                          <Link
                            href={`/tedx/${item.slug}`}
                            target="_blank"
                            className="p-1.5 border border-[var(--border)] rounded-xl hover:bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
                            title="View Public Profile"
                          >
                            <ExternalLink size={14} />
                          </Link>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 border border-[var(--border)] rounded-xl hover:bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
                            title="Edit Profile"
                          >
                            <Edit size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal for Create/Edit Portfolio */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-bold tracking-tight text-[var(--fg)] flex items-center gap-2">
                <Sparkles size={16} className="text-red-500" />
                {editingId ? 'Edit TEDx Crew Profile' : 'New TEDx Crew Profile'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[var(--fg-muted)] mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.display_name || ''}
                    onChange={(e) => {
                      const name = e.target.value
                      setFormData(prev => ({
                        ...prev,
                        display_name: name,
                        slug: editingId ? prev.slug : name.toLowerCase().trim().replace(/\s+/g, '-')
                      }))
                    }}
                    placeholder="e.g. Nived Shaji"
                    className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl text-xs font-sans focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[var(--fg-muted)] mb-1">
                    Unique URL Slug * (/tedx/...)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                    placeholder="nived-shaji"
                    className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[var(--fg-muted)] mb-1">
                    TEDx Role / Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g. Lead Organizer / Designer"
                    className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl text-xs font-sans focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-[var(--fg-muted)] mb-1">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={formData.team_name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, team_name: e.target.value }))}
                    placeholder="e.g. Tech & Operations"
                    className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl text-xs font-sans focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-[var(--fg-muted)] mb-1">
                  Bio / Statement
                </label>
                <textarea
                  rows={3}
                  value={formData.bio || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Short bio or personal mission..."
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl text-xs font-sans focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-[var(--fg-muted)] mb-1">
                  Profile Photo URL
                </label>
                <input
                  type="url"
                  value={formData.profile_photo_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, profile_photo_url: e.target.value }))}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <span className="text-xs font-mono font-bold">Active Portfolio</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                  />
                  <span className="text-xs font-mono font-bold">Publicly Scannable</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-xl text-xs font-mono text-[var(--fg-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-mono font-bold"
                >
                  {submitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
