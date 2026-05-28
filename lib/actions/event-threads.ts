'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { ThreadMode } from '@/lib/types'

/* ─────────────────────────────────────────
   TOGGLE DISCUSSION (CC/Admin)
───────────────────────────────────────── */

export async function toggleDiscussion(eventId: string, enabled: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'cc'].includes(profile.role)) return { error: 'Unauthorized' }

  const { error } = await supabaseAdmin
    .from('events')
    .update({ discussion_enabled: enabled })
    .eq('id', eventId)

  if (error) return { error: error.message }

  // If enabling, create conversation and add all registered students
  if (enabled) {
    await ensureEventThread(eventId)
  }

  revalidatePath(`/cc/events/${eventId}`)
  return { success: true }
}

/* ─────────────────────────────────────────
   UPDATE THREAD SETTINGS (CC/Admin)
───────────────────────────────────────── */

export async function updateThreadSettings(eventId: string, mode: ThreadMode) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'cc'].includes(profile.role)) return { error: 'Unauthorized' }

  const { error } = await supabaseAdmin
    .from('events')
    .update({ thread_mode: mode })
    .eq('id', eventId)

  if (error) return { error: error.message }

  revalidatePath(`/cc/events/${eventId}`)
  revalidatePath(`/student/events/${eventId}`)
  return { success: true }
}

/* ─────────────────────────────────────────
   ENSURE EVENT THREAD EXISTS
───────────────────────────────────────── */

async function ensureEventThread(eventId: string): Promise<string | null> {
  // Check if conversation already exists for this event
  const { data: existing } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .eq('event_id', eventId)
    .eq('type', 'group')
    .maybeSingle()

  if (existing) return existing.id

  // Get event info for conversation name
  const { data: event } = await supabaseAdmin
    .from('events')
    .select('title, created_by')
    .eq('id', eventId)
    .single()

  if (!event) return null

  // Create the group conversation
  const { data: conv, error: convErr } = await supabaseAdmin
    .from('conversations')
    .insert({
      type: 'group',
      name: event.title,
      event_id: eventId,
      status: 'active',
      created_by: event.created_by,
    })
    .select('id')
    .single()

  if (convErr || !conv) return null

  // Add the event creator as admin member
  await supabaseAdmin.from('conversation_members').insert({
    conversation_id: conv.id,
    user_id: event.created_by,
    role: 'admin',
    invite_status: 'accepted',
  })

  // Add all registered students as accepted members
  const { data: registrations } = await supabaseAdmin
    .from('registrations')
    .select('student_id')
    .eq('event_id', eventId)

  if (registrations?.length) {
    const members = registrations.map(r => ({
      conversation_id: conv.id,
      user_id: r.student_id,
      role: 'member' as const,
      invite_status: 'accepted' as const,
    }))

    // Batch insert (skip duplicates with onConflict)
    await supabaseAdmin
      .from('conversation_members')
      .upsert(members, { onConflict: 'conversation_id,user_id', ignoreDuplicates: true })
  }

  return conv.id
}

/* ─────────────────────────────────────────
   JOIN EVENT THREAD (called on registration)
───────────────────────────────────────── */

export async function joinEventThread(eventId: string, userId: string) {
  // Check if discussion is enabled
  const { data: event } = await supabaseAdmin
    .from('events')
    .select('discussion_enabled')
    .eq('id', eventId)
    .single()

  if (!event?.discussion_enabled) return { success: true } // silently skip

  // Ensure thread exists
  const convId = await ensureEventThread(eventId)
  if (!convId) return { success: true }

  // Add user as member (upsert to avoid duplicates)
  await supabaseAdmin
    .from('conversation_members')
    .upsert({
      conversation_id: convId,
      user_id: userId,
      role: 'member',
      invite_status: 'accepted',
    }, { onConflict: 'conversation_id,user_id', ignoreDuplicates: true })

  return { success: true }
}

/* ─────────────────────────────────────────
   GET EVENT THREAD INFO
───────────────────────────────────────── */

export async function getEventThread(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get event thread_mode
  const { data: eventData } = await supabaseAdmin
    .from('events')
    .select('thread_mode')
    .eq('id', eventId)
    .single()

  // Get user role
  const { data: userProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Use admin client to find conversation (bypasses RLS)
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('id, name, created_at')
    .eq('event_id', eventId)
    .eq('type', 'group')
    .maybeSingle()

  if (!conv) return null

  // Check if user is a member
  const { data: membership } = await supabaseAdmin
    .from('conversation_members')
    .select('id')
    .eq('conversation_id', conv.id)
    .eq('user_id', user.id)
    .eq('invite_status', 'accepted')
    .maybeSingle()

  // If not a member, check if they're registered or privileged → auto-join
  if (!membership) {
    const userRole = userProfile?.role || 'student'
    const privilegedRoles = ['admin', 'cc', 'manager', 'teacher', 'hod']

    // Check if registered student
    const { data: reg } = await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('student_id', user.id)
      .maybeSingle()

    if (reg || privilegedRoles.includes(userRole)) {
      // Auto-join: registered students + privileged roles (CC/admin can participate)
      await supabaseAdmin
        .from('conversation_members')
        .upsert({
          conversation_id: conv.id,
          user_id: user.id,
          role: privilegedRoles.includes(userRole) ? 'admin' : 'member',
          invite_status: 'accepted',
        }, { onConflict: 'conversation_id,user_id', ignoreDuplicates: true })
    } else {
      return null
    }
  }

  // Get member count
  const { count } = await supabaseAdmin
    .from('conversation_members')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conv.id)
    .eq('invite_status', 'accepted')

  return {
    ...conv,
    member_count: count || 0,
    thread_mode: (eventData?.thread_mode || 'open') as ThreadMode,
    user_role: userProfile?.role || 'student',
  }
}

/* ─────────────────────────────────────────
   GET THREAD MESSAGES
───────────────────────────────────────── */

export async function getThreadMessages(conversationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      body,
      sender_id,
      reply_to_id,
      is_pinned,
      created_at,
      is_deleted,
      sender:profiles!messages_sender_id_fkey(full_name, usn, role),
      reply_to:messages!messages_reply_to_id_fkey(body, sender:profiles!messages_sender_id_fkey(full_name)),
      message_reactions(id, user_id, emoji)
    `)
    .eq('conversation_id', conversationId)
    .eq('is_archived', false)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) {
    console.error('getThreadMessages error:', error)
    return []
  }

  return (data || []).map((m: any) => ({
    id: m.id,
    conversation_id: conversationId,
    sender_id: m.sender_id,
    body: m.body,
    reply_to_id: m.reply_to_id,
    is_pinned: m.is_pinned || false,
    created_at: m.created_at,
    is_archived: false,
    is_deleted: m.is_deleted,
    sender: m.sender || { full_name: 'Unknown' },
    reply_to: m.reply_to || null,
    reactions: m.message_reactions || [],
  }))
}

/* ─────────────────────────────────────────
   SEND THREAD MESSAGE
───────────────────────────────────────── */

export async function sendThreadMessage(
  conversationId: string,
  senderId: string,
  body: string,
  replyToId?: string | null,
  asUserId?: string | null
) {
  const supabase = await createClient()

  // Get caller's real role
  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', senderId)
    .single()

  const callerRole = callerProfile?.role || 'student'
  const isAdmin = callerRole === 'admin'

  // Determine actual sender (impersonated or real)
  const actualSenderId = (isAdmin && asUserId) ? asUserId : senderId

  // Get sender's role (for thread mode check)
  const { data: senderProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', actualSenderId)
    .single()

  // Get the event's thread_mode via conversation's event_id
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('event_id')
    .eq('id', conversationId)
    .single()

  if (conv?.event_id) {
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('thread_mode')
      .eq('id', conv.event_id)
      .single()

    const threadMode = event?.thread_mode || 'open'
    const senderRole = senderProfile?.role || 'student'
    const privilegedRoles = ['admin', 'cc', 'manager', 'teacher', 'hod']

    // Admin always bypasses thread mode restrictions
    if (threadMode === 'announcement' && !privilegedRoles.includes(senderRole) && !isAdmin) {
      return { error: 'This thread is in announcement mode. Only coordinators can post.' }
    }
  }

  // Verify membership (admin impersonation bypasses this)
  const { data: membership } = await supabase
    .from('conversation_members')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', actualSenderId)
    .eq('invite_status', 'accepted')
    .single()

  // If impersonating and target isn't a member, admin still can send
  if (!membership && !isAdmin) return { error: 'Not a member of this thread' }

  if (!body.trim()) return { error: 'Message cannot be empty' }

  const insertData: any = {
    conversation_id: conversationId,
    sender_id: actualSenderId,
    body: body.trim(),
  }

  if (replyToId) {
    insertData.reply_to_id = replyToId
  }

  // Use admin client when impersonating to bypass RLS
  const dbClient = (isAdmin && asUserId) ? supabaseAdmin : supabase

  const { data: msg, error } = await dbClient
    .from('messages')
    .insert(insertData)
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Parse @USN mentions and notify
  const mentionPattern = /@([A-Za-z0-9]+)/g
  const mentions = [...body.matchAll(mentionPattern)].map(m => m[1].toUpperCase())

  if (mentions.length > 0) {
    // Find users by USN
    const { data: mentionedUsers } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, usn')
      .in('usn', mentions)

    if (mentionedUsers?.length) {
      // Get sender name (use actualSenderId for display)
      const { data: sender } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', actualSenderId)
        .single()

      // Get conversation name for notification
      const { data: conv } = await supabase
        .from('conversations')
        .select('name, event_id')
        .eq('id', conversationId)
        .single()

      const notifications = mentionedUsers
        .filter(u => u.id !== actualSenderId) // Don't notify self
        .map(u => ({
          user_id: u.id,
          type: 'thread_mention' as const,
          title: `${sender?.full_name || 'Someone'} mentioned you`,
          body: body.trim().slice(0, 100),
          metadata: {
            conversation_id: conversationId,
            message_id: msg.id,
            event_id: conv?.event_id,
            event_name: conv?.name,
          },
          is_read: false,
          is_archived: false,
        }))

      if (notifications.length > 0) {
        await supabaseAdmin.from('notifications').insert(notifications)
      }
    }
  }

  return { success: true, messageId: msg.id }
}

/* ─────────────────────────────────────────
   TOGGLE REACTION
───────────────────────────────────────── */

export async function toggleReaction(messageId: string, userId: string, emoji: string) {
  const supabase = await createClient()

  // Check if reaction already exists
  const { data: existing } = await supabase
    .from('message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    // Remove reaction
    await supabase
      .from('message_reactions')
      .delete()
      .eq('id', existing.id)
    return { success: true, action: 'removed' as const }
  } else {
    // Add reaction
    const { error } = await supabase
      .from('message_reactions')
      .insert({ message_id: messageId, user_id: userId, emoji })
    if (error) return { error: error.message }
    return { success: true, action: 'added' as const }
  }
}

/* ─────────────────────────────────────────
   DELETE MESSAGE (soft delete)
───────────────────────────────────────── */

export async function deleteThreadMessage(messageId: string, userId: string) {
  const supabase = await createClient()

  // Get user role to allow CC/admin to delete any message
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
  const privilegedRoles = ['admin', 'cc']

  if (privilegedRoles.includes(profile?.role || '')) {
    // CC/admin can delete any message
    const { error } = await supabase
      .from('messages')
      .update({ is_deleted: true, body: '[deleted]' })
      .eq('id', messageId)
    if (error) return { error: error.message }
  } else {
    // Regular users can only delete own messages
    const { error } = await supabase
      .from('messages')
      .update({ is_deleted: true, body: '[deleted]' })
      .eq('id', messageId)
      .eq('sender_id', userId)
    if (error) return { error: error.message }
  }

  return { success: true }
}

/* ─────────────────────────────────────────
   PIN / UNPIN MESSAGE (CC/Admin)
───────────────────────────────────────── */

export async function pinMessage(messageId: string, userId: string, pinned: boolean) {
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
  if (!profile || !['admin', 'cc', 'manager'].includes(profile.role)) {
    return { error: 'Only coordinators can pin messages' }
  }

  const { error } = await supabase
    .from('messages')
    .update({ is_pinned: pinned })
    .eq('id', messageId)

  if (error) return { error: error.message }
  return { success: true }
}

/* ─────────────────────────────────────────
   GET THREAD MEMBERS (for @mention autocomplete)
   Filters out admin users so they can't be @mentioned
───────────────────────────────────────── */

export async function getThreadMembers(conversationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('conversation_members')
    .select(`
      user_id,
      profiles(id, full_name, usn, role)
    `)
    .eq('conversation_id', conversationId)
    .eq('invite_status', 'accepted')
    .limit(100)

  if (error) {
    console.error('getThreadMembers error:', error)
    return []
  }

  // Filter out admin users from @mention list
  return (data || [])
    .filter((m: any) => m.profiles?.role !== 'admin')
    .map((m: any) => ({
      id: m.user_id,
      full_name: m.profiles?.full_name || 'Unknown',
      usn: m.profiles?.usn || '',
      role: m.profiles?.role || 'student',
    }))
}

/* ─────────────────────────────────────────
   GET ALL THREAD MEMBERS (for admin impersonation)
   Returns all members regardless of role
───────────────────────────────────────── */

export async function getAllThreadMembers(conversationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabaseAdmin
    .from('conversation_members')
    .select(`
      user_id,
      profiles(id, full_name, usn, role)
    `)
    .eq('conversation_id', conversationId)
    .eq('invite_status', 'accepted')
    .limit(200)

  if (error) {
    console.error('getAllThreadMembers error:', error)
    return []
  }

  return (data || []).map((m: any) => ({
    id: m.user_id,
    full_name: m.profiles?.full_name || 'Unknown',
    usn: m.profiles?.usn || '',
    role: m.profiles?.role || 'student',
  }))
}
