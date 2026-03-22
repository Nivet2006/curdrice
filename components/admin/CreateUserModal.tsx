'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, X } from 'lucide-react'
import { createUserAdmin } from '@/lib/actions/admin'

export function CreateUserModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // We send standard form data instantly to the edge API bypass
    const fd = new FormData(e.currentTarget)
    const res = await createUserAdmin(fd)
    
    if (res?.error) {
      setError(res.error)
      setLoading(false)
    } else {
      setIsOpen(false)
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button variant="primary" className="bg-[#0a0a0a] flex items-center gap-2 px-6" onClick={() => setIsOpen(true)}>
        <Plus size={16} /> Create User
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-[#e0e0e0]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold font-sans text-[#0a0a0a]">Create New User</h2>
          <button onClick={() => setIsOpen(false)} className="text-[#999999] hover:text-[#0a0a0a] transition-colors"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Full Name" name="fullName" required placeholder="Nived Shaji" />
          
          <div className="grid grid-cols-2 gap-4">
             <Input label="Email Account" name="email" type="email" required placeholder="admin@example.com" />
             <Input label="USN" name="usn" required placeholder="1GD24CS011" className="uppercase font-mono" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">Department</label>
              <select name="department" className="rounded-xl border border-[#e0e0e0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] bg-white">
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="ME">ME</option>
                <option value="CV">CV</option>
                <option value="ISE">ISE</option>
                <option value="EEE">EEE</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">Role Level</label>
              <select name="role" className="rounded-xl border border-[#e0e0e0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] bg-white">
                <option value="student">Student</option>
                <option value="manager">Manager</option>
                <option value="admin">System Admin</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Semester" name="semester" type="number" min={1} max={8} required defaultValue={1} />
            <Input label="Year" name="year" type="number" min={1} max={4} required defaultValue={1} />
          </div>
          
          <Input label="Initial Password" name="password" type="password" required minLength={6} placeholder="••••••••" />

          {error && <p className="text-sm text-[#eb4b4b] font-mono mt-2 bg-[#ffeded] p-3 rounded-lg border border-[#eb4b4b]">{error}</p>}
          
          <Button type="submit" variant="primary" disabled={loading} className="w-full mt-4 bg-[#0a0a0a]">
             {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block align-middle mr-2" /> : null}
            Create User Account
          </Button>
        </form>
      </div>
    </div>
  )
}
