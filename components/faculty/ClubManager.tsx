'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  getClubs,
  createClub,
  getClubMembers,
  addMemberToClub,
  removeMemberFromClub,
  updateMemberRole
} from '@/lib/actions/club-actions'
import { supabase } from '@/lib/supabase/client'
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Shield,
  Search,
  Check,
  X,
  Sparkles,
  ChevronRight,
  Bookmark
} from 'lucide-react'
import { toast } from 'sonner'

interface Club {
  id: string
  name: string
  description: string | null
  parent_id: string | null
  created_at: string
}

interface ClubMember {
  id: string
  club_id: string
  profile_id: string
  role: string
  joined_at: string
  profiles: {
    id: string
    full_name: string
    usn: string
    department: string
    semester: number
    year: number
    role: string
  }
}

interface StudentOption {
  id: string
  full_name: string
  usn: string
  department: string
}

const PREDEFINED_ROLES = [
  'President',
  'Vice President',
  'Secretary',
  'Joint Secretary',
  'Treasurer',
  'Committee Head',
  'Technical Lead',
  'Social Media Manager',
  'Member'
]

function getClubLogo(name: string): string | null {
  const lower = name.toLowerCase()
  if (lower.includes('techeon')) return '/logos/techeon.png'
  if (lower.includes('grafix')) return '/logos/grafix.png'
  if (lower.includes('winfinity')) return '/logos/winfinity.png'
  return null
}

export function ClubManager() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [members, setMembers] = useState<ClubMember[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [loadingClubs, setLoadingClubs] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Creation State for Clubs
  const [showAddClub, setShowAddClub] = useState(false)
  const [clubName, setClubName] = useState('')
  const [clubDesc, setClubDesc] = useState('')
  const [parentId, setParentId] = useState('')
  const [submittingClub, setSubmittingClub] = useState(false)

  // Pre-calculate parent clubs and dynamic hierarchical club tree
  const parentClubs = useMemo(() => {
    const filtered = clubs.filter(c => !c.parent_id)
    return [...filtered].sort((a, b) => {
      const a1 = a.name.toLowerCase().includes('1%')
      const b1 = b.name.toLowerCase().includes('1%')
      if (a1 && !b1) return 1
      if (!a1 && b1) return -1
      return a.name.localeCompare(b.name)
    })
  }, [clubs])
  
  const clubTree = useMemo(() => {
    const rootClubs = clubs.filter(c => !c.parent_id)
    const sortedRoots = [...rootClubs].sort((a, b) => {
      const a1 = a.name.toLowerCase().includes('1%')
      const b1 = b.name.toLowerCase().includes('1%')
      if (a1 && !b1) return 1
      if (!a1 && b1) return -1
      return a.name.localeCompare(b.name)
    })
    return sortedRoots.map(parent => ({
      ...parent,
      subclubs: clubs.filter(c => c.parent_id === parent.id)
    }))
  }, [clubs])

  // Membership Add State
  const [searchStudent, setSearchStudent] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedRole, setSelectedRole] = useState('Member')
  const [submittingMember, setSubmittingMember] = useState(false)

  // Inline Editing State for Roles
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState('')

  // Custom Role States
  const [rolesList, setRolesList] = useState<string[]>(PREDEFINED_ROLES)
  const [customRoleName, setCustomRoleName] = useState('')
  const [editingCustomRoleName, setEditingCustomRoleName] = useState('')

  async function loadClubs(autoSelectId?: string) {
    setLoadingClubs(true)
    const res = await getClubs()
    setLoadingClubs(false)
    if (res.error) {
      toast.error(res.error)
    } else if (res.clubs) {
      setClubs(res.clubs)
      if (autoSelectId) {
        const found = res.clubs.find(c => c.id === autoSelectId)
        if (found) setSelectedClub(found)
      } else if (res.clubs.length > 0 && !selectedClub) {
        setSelectedClub(res.clubs[0])
      }
    }
  }

  async function loadMembers(clubId: string) {
    setLoadingMembers(true)
    const res = await getClubMembers(clubId)
    setLoadingMembers(false)
    if (res.error) {
      toast.error(res.error)
    } else if (res.members) {
      setMembers(res.members as any)
      const memberRoles = (res.members as any[]).map(m => m.role)
      setRolesList(prev => {
        const unique = new Set([...prev, ...memberRoles])
        return Array.from(unique)
      })
    }
  }

  async function loadStudents() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, usn, department')
      .in('role', ['student', 'cc'])
      .order('full_name')
    if (error) {
      console.error(error.message)
    } else {
      setStudents(data || [])
    }
  }

  useEffect(() => {
    loadClubs()
    loadStudents()
  }, [])

  useEffect(() => {
    if (selectedClub) {
      loadMembers(selectedClub.id)
    } else {
      setMembers([])
    }
  }, [selectedClub])

  const filteredStudents = useMemo(() => {
    if (!searchStudent) return []
    const q = searchStudent.toLowerCase()
    return students
      .filter(
        s =>
          s.full_name.toLowerCase().includes(q) ||
          s.usn.toLowerCase().includes(q)
      )
      .slice(0, 5) // Limit to 5 suggestions
  }, [students, searchStudent])

  async function handleCreateClub(e: React.FormEvent) {
    e.preventDefault()
    if (!clubName.trim()) return

    setSubmittingClub(true)
    const formData = new FormData()
    formData.append('name', clubName)
    formData.append('description', clubDesc)
    formData.append('parentId', parentId)

    const res = await createClub(formData)
    setSubmittingClub(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Club created successfully!')
      setClubName('')
      setClubDesc('')
      setParentId('')
      setShowAddClub(false)
      loadClubs(res.club?.id)
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClub || !selectedStudentId || !selectedRole) {
      toast.error('Please select a student and assign a role.')
      return
    }

    const finalRole = selectedRole === 'custom' ? customRoleName.trim() : selectedRole
    if (!finalRole) {
      toast.error('Please specify a role name.')
      return
    }

    setSubmittingMember(true)
    const formData = new FormData()
    formData.append('clubId', selectedClub.id)
    formData.append('profileId', selectedStudentId)
    formData.append('role', finalRole)

    const res = await addMemberToClub(formData)
    setSubmittingMember(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Member added to club successfully!')
      setSearchStudent('')
      setSelectedStudentId('')
      setSelectedRole('Member')
      setCustomRoleName('')
      if (selectedRole === 'custom' && !rolesList.includes(finalRole)) {
        setRolesList(prev => [...prev, finalRole])
      }
      loadMembers(selectedClub.id)
    }
  }

  async function handleRemoveMember(memberId: string, name: string) {
    if (!confirm(`Are you sure you want to remove ${name} from this club?`)) return

    const res = await removeMemberFromClub(memberId)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Member removed successfully.')
      if (selectedClub) loadMembers(selectedClub.id)
    }
  }

  async function handleSaveRole(memberId: string) {
    const finalRole = editingRole === 'custom' ? editingCustomRoleName.trim() : editingRole
    if (!finalRole) {
      toast.error('Please specify a role name.')
      return
    }

    const formData = new FormData()
    formData.append('memberId', memberId)
    formData.append('role', finalRole)

    const res = await updateMemberRole(formData)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Role updated.')
      setEditingMemberId(null)
      setEditingCustomRoleName('')
      if (editingRole === 'custom' && !rolesList.includes(finalRole)) {
        setRolesList(prev => [...prev, finalRole])
      }
      if (selectedClub) loadMembers(selectedClub.id)
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 space-y-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-[#0a0a0a] dark:text-white flex items-center gap-2">
            <Shield size={22} className="text-amber-500" />
            Club Member &amp; Role Management
          </h2>
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest mt-1">
            Assign coordinator roles and assign students to their clubs
          </p>
        </div>
        <button
          onClick={() => setShowAddClub(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white rounded-xl text-xs font-mono uppercase tracking-widest font-bold transition-all"
        >
          <Plus size={14} />
          Create New Club
        </button>
      </div>

      {/* Add Club Modal */}
      {showAddClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-[2rem] p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-tight text-[#0a0a0a] dark:text-white">Create New Club</h3>
              <button
                type="button"
                onClick={() => setShowAddClub(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X size={18} className="text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handleCreateClub} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Club Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google Developer Student Club"
                  value={clubName}
                  onChange={e => setClubName(e.target.value)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Description</label>
                <textarea
                  placeholder="Describe the club purpose, target members..."
                  value={clubDesc}
                  onChange={e => setClubDesc(e.target.value)}
                  rows={3}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Category / Parent Club (optional)</label>
                <select
                  value={parentId}
                  onChange={e => setParentId(e.target.value)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white"
                >
                  <option value="">Totally New Club (No Parent)</option>
                  {parentClubs.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClub(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono uppercase tracking-wider text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClub}
                  className="px-5 py-2 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {submittingClub ? 'Creating...' : 'Create Club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side: Clubs Navigation list */}
        <div className="space-y-4 lg:border-r lg:border-zinc-100 dark:lg:border-zinc-800 lg:pr-6">
          <h3 className="font-bold text-xs text-zinc-500 uppercase tracking-wider">Active Clubs ({clubs.length})</h3>
          
          {loadingClubs ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 animate-pulse" />
              ))}
            </div>
          ) : clubTree.length > 0 ? (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {clubTree.map(parent => {
                const isParentSelected = selectedClub?.id === parent.id
                return (
                  <div key={parent.id} className="space-y-1">
                    {/* Parent Club Button */}
                    <button
                      onClick={() => setSelectedClub(parent)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                        isParentSelected
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-md font-bold'
                          : 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-black dark:hover:border-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getClubLogo(parent.name) ? (
                          <img src={getClubLogo(parent.name)!} alt={parent.name} className="w-7 h-7 object-contain shrink-0" />
                        ) : (
                          <div className="w-7 h-7 flex items-center justify-center bg-zinc-200 dark:bg-zinc-850 text-[11px] font-bold rounded-md uppercase font-mono shrink-0">
                            {parent.name.charAt(0)}
                          </div>
                        )}
                        <span className="truncate text-xs tracking-tight uppercase font-mono">{parent.name}</span>
                      </div>
                      <ChevronRight size={14} className={`shrink-0 transition-transform ${isParentSelected ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                    </button>

                    {/* Subclubs rendered under parent */}
                    {parent.subclubs && parent.subclubs.length > 0 && (
                      <div className="pl-4 border-l border-zinc-200 dark:border-zinc-800 ml-4 space-y-1">
                        {parent.subclubs.map(sub => {
                          const isSubSelected = selectedClub?.id === sub.id
                          return (
                            <button
                              key={sub.id}
                              onClick={() => setSelectedClub(sub)}
                              className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between group text-xs ${
                                isSubSelected
                                  ? 'bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white font-bold'
                                  : 'text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {getClubLogo(sub.name) ? (
                                  <img src={getClubLogo(sub.name)!} alt={sub.name} className="w-6 h-6 object-contain shrink-0" />
                                ) : (
                                  <div className="w-6 h-6 flex items-center justify-center bg-zinc-200 dark:bg-zinc-850 text-[9px] font-bold rounded uppercase font-mono shrink-0">
                                    {sub.name.charAt(0)}
                                  </div>
                                )}
                                <span className="truncate font-mono uppercase text-[10px]">{sub.name}</span>
                              </div>
                              <ChevronRight size={10} className={`shrink-0 transition-transform ${isSubSelected ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-10 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl">
              <Bookmark size={20} className="mx-auto text-zinc-300 mb-2" />
              <p className="text-[10px] font-mono text-zinc-400">No clubs created yet.</p>
            </div>
          )}
        </div>

        {/* Right Side: Club Membership Manager */}
        <div className="lg:col-span-3 space-y-8">
          {selectedClub ? (
            <div className="space-y-6">
              {/* Selected Club Overview Card */}
              <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-[2rem] border border-zinc-150 dark:border-zinc-800 relative overflow-hidden flex items-start gap-4">
                {getClubLogo(selectedClub.name) ? (
                  <img src={getClubLogo(selectedClub.name)!} alt={selectedClub.name} className="w-16 h-16 object-contain shrink-0" />
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 text-xl font-black rounded-xl uppercase font-mono shrink-0">
                    {selectedClub.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {selectedClub.parent_id && (
                    <span className="inline-block text-[9px] font-mono uppercase bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full mb-1 font-bold">
                      Subclub of {clubs.find(c => c.id === selectedClub.parent_id)?.name || 'Parent Club'}
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-black uppercase text-zinc-900 dark:text-white">{selectedClub.name}</h3>
                    {!selectedClub.parent_id && (
                      <button
                        type="button"
                        onClick={() => {
                          setParentId(selectedClub.id)
                          setShowAddClub(true)
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-850 dark:text-zinc-200 rounded-lg text-[10px] font-mono uppercase font-bold transition-all"
                      >
                        <Plus size={10} />
                        Create Subgroup
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-mono">
                    {selectedClub.description || 'No description provided.'}
                  </p>
                </div>
                <div className="absolute right-4 bottom-4 opacity-[0.03] pointer-events-none">
                  <Users size={120} />
                </div>
              </div>

              {/* Add Member Form */}
              <form onSubmit={handleAddMember} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Add Club Member / Coordinator</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search Student field */}
                  <div className="relative flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Search Student Name / USN</label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Type name or USN..."
                        value={searchStudent}
                        onChange={e => {
                          setSearchStudent(e.target.value)
                          setSelectedStudentId('')
                        }}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs outline-none focus:ring-2 focus:ring-black dark:text-white"
                      />
                    </div>

                    {/* Suggestions list */}
                    {filteredStudents.length > 0 && !selectedStudentId && (
                      <div className="absolute top-full left-0 right-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl mt-1 shadow-2xl z-50 divide-y divide-zinc-100 dark:divide-zinc-800">
                        {filteredStudents.map(student => (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => {
                              setSelectedStudentId(student.id)
                              setSearchStudent(`${student.full_name} (${student.usn})`)
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex justify-between dark:text-white"
                          >
                            <span className="font-bold">{student.full_name}</span>
                            <span className="font-mono text-zinc-400">{student.usn} ({student.department})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Role selection */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Assign Role</label>
                    <select
                      value={selectedRole}
                      onChange={e => setSelectedRole(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black dark:text-white"
                    >
                      {rolesList.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                      <option value="custom">+ Create Custom Role...</option>
                    </select>

                    {selectedRole === 'custom' && (
                      <input
                        type="text"
                        placeholder="Enter custom role name..."
                        value={customRoleName}
                        onChange={e => setCustomRoleName(e.target.value)}
                        required
                        className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-black dark:text-white"
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submittingMember || !selectedStudentId}
                    className="px-6 py-3 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Plus size={14} />
                    {submittingMember ? 'Adding...' : 'Add Coordinator'}
                  </button>
                </div>
              </form>

              {/* Members List Table */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500">Club Coordinators &amp; Members ({members.length})</h4>

                <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900">
                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_120px_160px_100px] gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 items-center font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                    <span>Name / USN</span>
                    <span>Department</span>
                    <span>Assigned Role</span>
                    <span className="text-center">Action</span>
                  </div>

                  {/* Rows */}
                  {loadingMembers ? (
                    <div className="p-8 text-center animate-pulse">Loading members...</div>
                  ) : members.length > 0 ? (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[300px] overflow-y-auto">
                      {members.map(member => (
                        <div
                          key={member.id}
                          className="grid grid-cols-[1fr_120px_160px_100px] gap-2 px-4 py-3 items-center hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{member.profiles?.full_name}</p>
                            <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">{member.profiles?.usn}</p>
                          </div>

                          <span className="font-mono text-xs text-zinc-500">{member.profiles?.department || 'General'}</span>

                          {/* Role edit wrapper */}
                          <div>
                            {editingMemberId === member.id ? (
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <select
                                    value={editingRole}
                                    onChange={e => {
                                      setEditingRole(e.target.value)
                                      if (e.target.value === 'custom') {
                                        setEditingCustomRoleName('')
                                      }
                                    }}
                                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-1 text-xs outline-none dark:text-white"
                                  >
                                    {rolesList.map(r => (
                                      <option key={r} value={r}>{r}</option>
                                    ))}
                                    <option value="custom">+ Create Custom Role...</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveRole(member.id)}
                                    className="p-1.5 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500/20"
                                    title="Save"
                                  >
                                    <Check size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingMemberId(null)
                                      setEditingCustomRoleName('')
                                    }}
                                    className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg hover:bg-zinc-200"
                                    title="Cancel"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                                {editingRole === 'custom' && (
                                  <input
                                    type="text"
                                    placeholder="Enter custom role..."
                                    value={editingCustomRoleName}
                                    onChange={e => setEditingCustomRoleName(e.target.value)}
                                    required
                                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-black dark:text-white"
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 group/role">
                                <span className="text-xs font-bold font-mono text-zinc-700 dark:text-zinc-300 uppercase bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                                  {member.role}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMemberId(member.id)
                                    setEditingRole(member.role)
                                  }}
                                  className="opacity-0 group-hover/role:opacity-100 p-1 text-zinc-400 hover:text-black dark:hover:text-white transition-all"
                                  title="Edit Role"
                                >
                                  <Edit2 size={11} />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.id, member.profiles?.full_name)}
                              className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
                              title="Remove Member"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Users size={24} className="mx-auto text-zinc-200 dark:text-zinc-700 mb-2" />
                      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">No members registered in this club</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center border-2 border-dashed border-zinc-150 dark:border-zinc-800 rounded-[2.5rem]">
              <Users size={40} className="mx-auto text-zinc-200 dark:text-zinc-700 mb-4 animate-bounce" />
              <p className="font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-lg">No Club Selected</p>
              <p className="text-xs text-zinc-400 mt-2">Select a club from the left panel to manage its members and assign coordinator roles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
