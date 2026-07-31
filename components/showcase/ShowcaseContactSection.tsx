'use client'

import React, { useState } from 'react'
import { submitClubInquiryAction } from '@/lib/actions/club-actions'
import { Send, MapPin, Mail, Instagram, Linkedin, Github, Twitter, Globe, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface ShowcaseContactProps {
  clubId: string
  clubName: string
  contactConfig: any
  primaryColor?: string
}

export function ShowcaseContactSection({
  clubId,
  clubName,
  contactConfig,
  primaryColor = '#f59e0b'
}: ShowcaseContactProps) {
  const [senderName, setSenderName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const locationText = contactConfig?.locationText || 'Campus Main Block, Room 304'
  const socialLinks = contactConfig?.socialLinks || {}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!senderName || !senderEmail || !message) {
      toast.error('Please complete all required fields.')
      return
    }

    setSubmitting(true)
    const res = await submitClubInquiryAction(clubId, {
      sender_name: senderName,
      sender_email: senderEmail,
      subject,
      message
    })
    setSubmitting(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Your message has been sent to the club admin!')
      setSubmitted(true)
      setSenderName('')
      setSenderEmail('')
      setSubject('')
      setMessage('')
    }
  }

  return (
    <section id="contact" className="py-24 border-t border-[#E6E8EC] dark:border-white/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <span
            className="text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 inline-block shadow-sm"
            style={{ color: primaryColor }}
          >
            GET IN TOUCH
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase text-zinc-900 dark:text-white tracking-tight">
            Contact {clubName}
          </h2>
          <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Have questions about upcoming events, memberships, or collaborations? Send us a direct inquiry.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Details & Socials */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl space-y-8 flex flex-col justify-between shadow-xl">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold font-mono uppercase text-zinc-900 dark:text-white">Reach Us Directly</h3>
              <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We respond to inquiries within 24-48 hours. Connect with our executive coordinators or visit our club workspace on campus.
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-amber-500 shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-zinc-900 dark:text-white uppercase">Location</h4>
                    <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400">{locationText}</p>
                  </div>
                </div>

                {contactConfig?.recipientEmail && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-amber-500 shrink-0">
                      <Mail size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold font-mono text-zinc-900 dark:text-white uppercase">Email</h4>
                      <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400">{contactConfig.recipientEmail}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Social Channels</h4>
              <div className="flex flex-wrap gap-3">
                {socialLinks.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-3 bg-zinc-100 dark:bg-zinc-950 hover:bg-zinc-200 dark:hover:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 transition-all">
                    <Instagram size={18} />
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-3 bg-zinc-100 dark:bg-zinc-950 hover:bg-zinc-200 dark:hover:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 transition-all">
                    <Linkedin size={18} />
                  </a>
                )}
                {socialLinks.github && (
                  <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="p-3 bg-zinc-100 dark:bg-zinc-950 hover:bg-zinc-200 dark:hover:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 transition-all">
                    <Github size={18} />
                  </a>
                )}
                {socialLinks.twitter && (
                  <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-3 bg-zinc-100 dark:bg-zinc-950 hover:bg-zinc-200 dark:hover:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 transition-all">
                    <Twitter size={18} />
                  </a>
                )}
                {socialLinks.website && (
                  <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-3 bg-zinc-100 dark:bg-zinc-950 hover:bg-zinc-200 dark:hover:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 transition-all">
                    <Globe size={18} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-xl space-y-6">
            <h3 className="text-xl font-bold font-mono uppercase text-zinc-900 dark:text-white">Send Inquiry</h3>

            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <CheckCircle2 size={48} className="mx-auto text-emerald-500 animate-bounce" />
                <h4 className="text-xl font-bold font-mono text-zinc-900 dark:text-white uppercase">Message Delivered!</h4>
                <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                  Thank you for reaching out. The assigned admin for {clubName} will review your inquiry shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-950 hover:bg-zinc-200 dark:hover:bg-black border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold uppercase text-zinc-900 dark:text-white rounded-xl"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-bold">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name..."
                    value={senderName}
                    onChange={e => setSenderName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-bold">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={senderEmail}
                    onChange={e => setSenderEmail(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-bold">Subject (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Workshop Inquiry, Collaboration"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-bold">Message *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Type your message here..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-amber-500 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl font-mono font-bold uppercase tracking-widest text-black text-xs transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send size={14} />
                  {submitting ? 'Sending Inquiry...' : 'Submit Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
