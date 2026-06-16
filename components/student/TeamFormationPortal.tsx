'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  User,
  Plus,
  X,
  Check,
  LogOut,
  Search,
  UserPlus,
  Users2,
  Bookmark,
  ShieldAlert
} from 'lucide-react'
import {
  getEventTeamsData,
  createTeam,
  sendJoinRequest,
  respondToRequest,
  inviteMember,
  leaveTeam
} from '@/lib/actions/hackathon-actions'
import { toast } from 'sonner'
import { ProjectSubmissionPortal } from '@/components/student/ProjectSubmissionPortal'

interface TeamFormationPortalProps {
  eventId: string
  currentUserId: string
}

export function TeamFormationPortal({ eventId, currentUserId }: TeamFormationPortalProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [teamName, setTeamName] = useState('')
  const [creating, setCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [inviteSearchQuery, setInviteSearchQuery] = useState('')
  const [invitingId, setInvitingId] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    const res = await getEventTeamsData(eventId)
    setLoading(false)
    if ((res as any).error) {
      toast.error((res as any).error)
    } else {
      setData(res)
    }
  }

  useEffect(() => {
    loadData()
  }, [eventId])

  if (loading) {
    return (
      <div className="py-12 text-center animate-pulse font-mono text-xs text-zinc-400">
        Loading Team Portal...
      </div>
    )
  }

  if (!data) return null

  const {
    event,
    teams,
    memberships,
    teamLessStudents,
    myTeam,
    myTeamMembers,
    myTeamRequests,
    mySentRequests
  } = data

  const minMembers = event?.min_team_members || 2
  const maxMembers = event?.max_team_members || 4

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!teamName.trim()) return
    setCreating(true)
    const res = await createTeam(eventId, teamName)
    setCreating(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Team created successfully!')
      setTeamName('')
      loadData()
    }
  }

  async function handleRequestJoin(teamId: string) {
    const res = await sendJoinRequest(teamId)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Join request sent successfully!')
      loadData()
    }
  }

  async function handleRespondRequest(requestId: string, approve: boolean) {
    const res = await respondToRequest(requestId, approve)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(approve ? 'Request approved!' : 'Request rejected.')
      loadData()
    }
  }

  async function handleInvite(profileId: string) {
    if (!myTeam) return
    setInvitingId(profileId)
    const res = await inviteMember(myTeam.id, profileId)
    setInvitingId(null)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Member added directly!')
      setInviteSearchQuery('')
      loadData()
    }
  }

  async function handleLeaveTeam() {
    if (!myTeam) return
    const isLeader = myTeam.leader_id === currentUserId
    const msg = isLeader
      ? 'Are you sure you want to leave? As the leader, this will DELETE the team and remove all members!'
      : 'Are you sure you want to leave this team?'
    
    if (!confirm(msg)) return

    const res = await leaveTeam(myTeam.id)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Left the team.')
      loadData()
    }
  }

  // Filter team search
  const filteredTeams = teams.filter((t: any) =>
    t.team_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter registered team-less students for invites
  const filteredInvitations = teamLessStudents.filter((s: any) =>
    (s.full_name.toLowerCase().includes(inviteSearchQuery.toLowerCase()) ||
    s.usn.toLowerCase().includes(inviteSearchQuery.toLowerCase())) &&
    s.id !== currentUserId
  )

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 space-y-8 shadow-sm">
      {/* Header */}
      <div className="border-b border-zinc-100 dark:border-zinc-850 pb-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-[#0a0a0a] dark:text-white flex items-center gap-2">
          <Users2 size={24} className="text-amber-500" />
          Hackathon Team Portal
        </h2>
        <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest mt-1">
          Form teams of {minMembers} to {maxMembers} members for {event.title}
        </p>
      </div>

      {myTeam ? (
        <>
        {/* USER IS IN A TEAM */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: My Team Members */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] space-y-6 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-mono uppercase bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full font-bold">
                    Active Team
                  </span>
                  <h3 className="text-xl font-black uppercase text-zinc-900 dark:text-white mt-2">
                    {myTeam.team_name}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    Team Size: {myTeamMembers.length} / {maxMembers} (Min: {minMembers})
                  </p>
                </div>
                <button
                  onClick={handleLeaveTeam}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-500 hover:text-rose-600 dark:border-rose-950/20 dark:hover:bg-rose-950/20 rounded-xl text-xs font-mono uppercase font-bold transition-all"
                >
                  <LogOut size={12} />
                  {myTeam.leader_id === currentUserId ? 'Delete Team' : 'Leave'}
                </button>
              </div>

              {/* Members List */}
              <div className="space-y-3">
                <p className="font-bold text-xs uppercase tracking-wider text-zinc-500">Members List</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {myTeamMembers.map((member: any) => {
                    const isLeader = member.profile_id === myTeam.leader_id
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl"
                      >
                        <div className="p-2 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                          <User size={14} className={isLeader ? 'text-amber-500' : 'text-zinc-400'} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate flex items-center gap-1">
                            {member.profile?.full_name}
                            {isLeader && (
                              <span className="text-[8px] font-mono uppercase bg-amber-500/10 text-amber-600 px-1 py-0.5 rounded font-black">
                                Lead
                              </span>
                            )}
                          </p>
                          <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">{member.profile?.usn}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Team Constraints Warning */}
              {myTeamMembers.length < minMembers && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-mono">
                  <ShieldAlert size={14} />
                  <span>Warning: Min team capacity of {minMembers} members not met. Add more members.</span>
                </div>
              )}
            </div>

            {/* Leader Panel: Join Requests */}
            {myTeam.leader_id === currentUserId && (
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500">Pending Join Requests ({myTeamRequests.length})</h4>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 divide-y divide-zinc-150 dark:divide-zinc-800">
                  {myTeamRequests.length > 0 ? (
                    myTeamRequests.map((req: any) => (
                      <div key={req.id} className="flex justify-between items-center px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-850">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-250 truncate">{req.profile?.full_name}</p>
                          <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">
                            {req.profile?.usn} • {req.profile?.department}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespondRequest(req.id, true)}
                            className="p-1.5 bg-green-500/15 text-green-600 rounded-lg hover:bg-green-500/20"
                            title="Approve"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => handleRespondRequest(req.id, false)}
                            className="p-1.5 bg-rose-500/15 text-rose-600 rounded-lg hover:bg-rose-500/20"
                            title="Reject"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs font-mono text-zinc-400">
                      No pending join requests.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Leader recruiting / Member invite */}
          <div className="space-y-6">
            {myTeam.leader_id === currentUserId ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <UserPlus size={14} className="text-zinc-400" />
                  Recruit Registered Members
                </h4>
                <div className="relative">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search registered, team-less students..."
                    value={inviteSearchQuery}
                    onChange={e => setInviteSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs outline-none focus:ring-2 focus:ring-black dark:text-white"
                  />
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[200px] overflow-y-auto pr-1">
                  {inviteSearchQuery.trim() !== '' ? (
                    filteredInvitations.length > 0 ? (
                      filteredInvitations.map((student: any) => (
                        <div key={student.id} className="flex justify-between items-center py-2">
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{student.full_name}</p>
                            <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">{student.usn}</p>
                          </div>
                          <button
                            onClick={() => handleInvite(student.id)}
                            disabled={invitingId === student.id}
                            className="text-[9px] font-mono uppercase bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 px-2 py-1 rounded-lg font-bold shrink-0"
                          >
                            Add
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-[9px] font-mono text-zinc-400 py-2">No matching students found.</p>
                    )
                  ) : (
                    <p className="text-[9px] font-mono text-zinc-400 py-2">Type student name or USN to invite.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] text-center space-y-2">
                <Bookmark size={20} className="mx-auto text-zinc-300" />
                <p className="font-bold text-xs text-zinc-700 dark:text-zinc-300">Looking for members?</p>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Ask your team leader ({myTeamMembers.find((m: any) => m.profile_id === myTeam.leader_id)?.profile?.full_name}) to invite other participants.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Project Submission Section */}
        <div className="mt-2">
          <ProjectSubmissionPortal
            eventId={eventId}
            teamId={myTeam.id}
            teamName={myTeam.team_name}
            isTeamMember={true}
          />
        </div>
        </>
      ) : (
        /* USER IS NOT IN A TEAM */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Create Team Form & My Sent Requests */}
          <div className="space-y-6 lg:col-span-1">
            {/* Create Team Card */}
            <form onSubmit={handleCreateTeam} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Plus size={14} className="text-zinc-400" />
                Create New Team
              </h3>
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  placeholder="Enter a unique team name..."
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  required
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-black dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={creating || !teamName.trim()}
                className="w-full py-2.5 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Form Team'}
              </button>
            </form>

            {/* Sent Requests Card */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500">Sent Join Requests</h4>
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 divide-y divide-zinc-150 dark:divide-zinc-800">
                {mySentRequests.length > 0 ? (
                  mySentRequests.map((req: any) => (
                    <div key={req.id} className="flex justify-between items-center px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-850">
                      <div>
                        <p className="text-xs font-bold text-zinc-850 dark:text-zinc-200">{req.team?.team_name}</p>
                        <span className="inline-block text-[8px] font-mono uppercase bg-amber-500/10 text-amber-600 px-1 py-0.5 rounded mt-0.5 font-bold animate-pulse">
                          {req.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-[10px] font-mono text-zinc-400">
                    No active sent requests.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Browse Existing Teams */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-500">Available Teams ({teams.length})</h3>
              <div className="relative w-48 shrink-0">
                <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search team name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 text-[10px] outline-none focus:ring-1 focus:ring-black dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1">
              {filteredTeams.length > 0 ? (
                filteredTeams.map((team: any) => {
                  const teamMembers = memberships.filter((m: any) => m.team_id === team.id)
                  const hasRequested = mySentRequests.some((r: any) => r.team_id === team.id)
                  const isFull = teamMembers.length >= maxMembers

                  return (
                    <div
                      key={team.id}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl flex flex-col justify-between gap-4 hover:border-black dark:hover:border-white transition-all shadow-sm"
                    >
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{team.team_name}</h4>
                        <p className="text-[9px] text-zinc-400 font-mono mt-0.5">Leader: {team.leader?.full_name}</p>
                        <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-350 mt-2">
                          Members: {teamMembers.length} / {maxMembers}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRequestJoin(team.id)}
                        disabled={hasRequested || isFull}
                        className={`w-full py-2 rounded-xl text-xs font-mono uppercase font-bold transition-all border ${
                          hasRequested
                            ? 'bg-zinc-50 border-zinc-200 text-zinc-400 cursor-not-allowed'
                            : isFull
                            ? 'bg-zinc-50 border-rose-100 text-rose-400 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 border-transparent shadow-sm'
                        }`}
                      >
                        {hasRequested ? 'Requested' : isFull ? 'Full' : 'Request to Join'}
                      </button>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl">
                  <Users size={24} className="mx-auto text-zinc-300 mb-2" />
                  <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest">No Teams Formed Yet</p>
                  <p className="text-[10px] text-zinc-400 mt-1">Form the first team above or search for another name.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
