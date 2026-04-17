'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserRole, deleteUser, verifyAdminPassword, updateUserDetails } from '@/lib/actions/admin'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Shield, X, Pencil } from 'lucide-react'
import type { Role } from '@/lib/types'

type Profile = {
  id: string
  full_name: string
  usn: string
  department: string
  semester: number
  year: number
  role: string
}

type PendingAction = {
  type: 'role' | 'suspend' | 'activate'
  userId: string
  userName: string
  newRole?: Role
  label: string
}

export function UserTable({ users }: { users: Profile[] }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  // Edit states
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [editForm, setEditForm] = useState({ full_name: '', usn: '', department: '', semester: 1, year: 1 })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  function requestAction(action: PendingAction) {
    setPendingAction(action)
    setPassword('')
    setPasswordError(null)
  }

  function cancelAction() {
    setPendingAction(null)
    setPassword('')
    setPasswordError(null)
  }

  function openEdit(user: Profile) {
    setEditingUser(user)
    setEditForm({
      full_name: user.full_name,
      usn: user.usn,
      department: user.department,
      semester: user.semester,
      year: user.year || 1
    })
    setEditError(null)
  }

  async function saveEdit() {
    if (!editingUser) return
    setEditLoading(true)
    setEditError(null)
    const res = await updateUserDetails(editingUser.id, {
      ...editForm,
      semester: Number(editForm.semester),
      year: Number(editForm.year)
    })
    if (res.error) {
      setEditError(res.error)
      setEditLoading(false)
      return
    }
    setEditingUser(null)
    setEditLoading(false)
    router.refresh()
  }

  async function confirmAction() {
    if (!pendingAction || !password.trim()) return
    setIsVerifying(true)
    setPasswordError(null)

    const verify = await verifyAdminPassword(password)
    if (verify.error) {
      setPasswordError(verify.error)
      setIsVerifying(false)
      return
    }

    const { userId, type, newRole } = pendingAction
    setLoadingId(userId)
    setPendingAction(null)
    setPassword('')
    setIsVerifying(false)

    startTransition(async () => {
      if (type === 'suspend') {
        await deleteUser(userId)
      } else if (type === 'activate') {
        await updateUserRole(userId, 'student')
      } else if (type === 'role' && newRole) {
        await updateUserRole(userId, newRole)
      }
      setLoadingId(null)
      router.refresh()
    })
  }

  return (
    <>
      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-[#e0e0e0]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-[#0a0a0a] text-lg">Edit User</h3>
                <p className="text-xs font-mono text-[#999]">{editingUser.usn}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-[#999] hover:text-[#0a0a0a]">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-mono text-[#555] uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                  className="border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-mono text-[#555] uppercase tracking-wider">USN</label>
                  <input
                    type="text"
                    value={editForm.usn}
                    onChange={e => setEditForm(f => ({ ...f, usn: e.target.value.toUpperCase() }))}
                    className="border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] uppercase"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-mono text-[#555] uppercase tracking-wider">Department</label>
                  <select
                    value={editForm.department}
                    onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
                    className="border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] bg-white"
                  >
                    {['CSE', 'ECE', 'ME', 'CV', 'ISE', 'EEE'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-mono text-[#555] uppercase tracking-wider">Semester</label>
                  <select
                    value={editForm.semester}
                    onChange={e => setEditForm(f => ({ ...f, semester: Number(e.target.value) }))}
                    className="border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-mono text-[#555] uppercase tracking-wider">Year</label>
                  <select
                    value={editForm.year}
                    onChange={e => setEditForm(f => ({ ...f, year: Number(e.target.value) }))}
                    className="border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] bg-white"
                  >
                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {editError && (
                <p className="text-xs font-mono text-[#eb4b4b] bg-[#ffeded] px-3 py-2 rounded-lg border border-[#eb4b4b]">
                  {editError}
                </p>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-mono border border-[#e0e0e0] rounded-xl hover:bg-[#f5f5f5] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={editLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-mono rounded-xl bg-[#0a0a0a] text-white hover:bg-[#333] transition-colors disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-[#e0e0e0]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center border border-[#e0e0e0]">
                  <Shield size={18} className="text-[#0a0a0a]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0a0a0a]">Confirm Action</h3>
                  <p className="text-xs font-mono text-[#999]">Admin verification required</p>
                </div>
              </div>
              <button onClick={cancelAction} className="text-[#999] hover:text-[#0a0a0a]">
                <X size={18} />
              </button>
            </div>

            <div className="bg-[#f5f5f5] rounded-xl px-4 py-3 mb-5 border border-[#e0e0e0]">
              <p className="text-xs font-mono text-[#555] uppercase tracking-wider mb-1">Action</p>
              <p className="text-sm font-semibold text-[#0a0a0a]">{pendingAction.label}</p>
              <p className="text-xs font-mono text-[#999] mt-0.5">{pendingAction.userName}</p>
            </div>

            <div className="flex flex-col gap-2 mb-4">
              <label className="text-xs font-mono text-[#555] uppercase tracking-wider">
                Your Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmAction()}
                placeholder="Enter your password to confirm"
                autoFocus
                className="w-full border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]"
              />
              {passwordError && (
                <p className="text-xs font-mono text-[#eb4b4b] bg-[#ffeded] px-3 py-2 rounded-lg border border-[#eb4b4b]">
                  {passwordError}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelAction}
                className="flex-1 px-4 py-2.5 text-sm font-mono border border-[#e0e0e0] rounded-xl hover:bg-[#f5f5f5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={isVerifying || !password.trim()}
                className={`flex-1 px-4 py-2.5 text-sm font-mono rounded-xl text-white transition-colors ${
                  pendingAction.type === 'suspend'
                    ? 'bg-[#eb4b4b] hover:bg-red-700 disabled:opacity-50'
                    : 'bg-[#0a0a0a] hover:bg-[#333] disabled:opacity-50'
                }`}
              >
                {isVerifying ? 'Verifying...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto border border-[#e0e0e0] rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left font-sans text-sm">
          <thead className="bg-[#f5f5f5] text-[#555555] font-mono text-xs uppercase tracking-widest border-b border-[#e0e0e0]">
            <tr>
              <th className="px-6 py-4 font-normal">Name & USN</th>
              <th className="px-6 py-4 font-normal">Course</th>
              <th className="px-6 py-4 font-normal">Role</th>
              <th className="px-6 py-4 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0e0e0]">
            {users.map((user) => (
              <tr
                key={user.id}
                className={`hover:bg-[#fafafa] transition-colors ${
                  loadingId === user.id ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="font-bold text-[#0a0a0a]">{user.full_name}</div>
                  <div className="font-mono text-xs text-[#999999]">{user.usn.toUpperCase()}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-xs text-[#0a0a0a] bg-[#f5f5f5] px-2 py-1 rounded-md border border-[#e0e0e0]">
                    {user.department} (S{user.semester})
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.role === 'deleted' ? (
                    <span className="font-mono text-[10px] uppercase tracking-widest bg-[#ffeded] text-[#eb4b4b] px-3 py-1.5 rounded-md border border-[#eb4b4b] font-bold">
                      Suspended
                    </span>
                  ) : (
                    <Badge variant={user.role as Role}>{user.role}</Badge>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 items-center">
                    {user.role !== 'deleted' && (
                      <>
                        <button
                          onClick={() => openEdit(user)}
                          disabled={loadingId === user.id}
                          className="p-1.5 rounded-lg border border-[#e0e0e0] hover:bg-[#f5f5f5] transition-colors disabled:opacity-50"
                          title="Edit details"
                        >
                          <Pencil size={13} className="text-[#555]" />
                        </button>
                        <select
                          className="font-mono text-xs border border-[#e0e0e0] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0a0a0a] bg-white"
                          defaultValue={user.role}
                          key={user.role}
                          onChange={(e) => {
                            if (e.target.value === user.role) return
                            requestAction({
                              type: 'role',
                              userId: user.id,
                              userName: user.full_name,
                              newRole: e.target.value as Role,
                              label: `Change role to ${e.target.value}`
                            })
                          }}
                          disabled={loadingId === user.id}
                        >
                          <option value="student">Student</option>
                          <option value="manager">Manager</option>
                          <option value="cc">Coordinator (CC)</option>
                          <option value="pr">Public Relations (PR)</option>
                          <option value="teacher">Teacher</option>
                          <option value="hod">HOD</option>
                          <option value="admin">Admin</option>
                        </select>

                        <button
                          onClick={() => requestAction({
                            type: 'suspend',
                            userId: user.id,
                            userName: user.full_name,
                            label: 'Suspend account'
                          })}
                          disabled={loadingId === user.id}
                          className="px-3 py-1.5 text-xs font-mono rounded-lg bg-[#eb4b4b] text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          Suspend
                        </button>
                      </>
                    )}

                    {user.role === 'deleted' && (
                      <button
                        onClick={() => requestAction({
                          type: 'activate',
                          userId: user.id,
                          userName: user.full_name,
                          label: 'Reactivate account as Student'
                        })}
                        disabled={loadingId === user.id}
                        className="px-3 py-1.5 text-xs font-mono rounded-lg bg-[#0a0a0a] text-white hover:bg-[#333] transition-colors disabled:opacity-50"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center font-mono text-xs text-[#999999]">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
