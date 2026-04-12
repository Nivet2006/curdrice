'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/* ─────────────────────────────────────────
   NOTIFICATIONS
───────────────────────────────────────── */

export async function getNotifications(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
  if (error) { console.error(error); return [] }
  return data || []
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .eq('is_archived', false)
  if (error) return 0
  return count || 0
}

export async function archiveNotification(notificationId: string, userId: string) {
  const supabase = createClient()
  await supabase
    .from('notifications')
    .update({ is_archived: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
}

export async function deleteNotification(notificationId: string, userId: string) {
  const supabase = createClient()
  await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId)
}

// Keep old names as aliases so existing code doesn't break
export const archiveMessage = archiveNotification
export const deleteMessage = deleteNotification

export async function markNotificationRead(notificationId: string, userId: string) {
  const supabase = createClient()
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
}

/* Called from events.ts after a successful registration */
export async function createEventNotification(
  userId: string,
  eventId: string,
  qrCode: string
) {
  const supabase = createClient()
  const { data: event } = await supabase
    .from('events')
    .select('title, event_date, location')
    .eq('id', eventId)
    .single()

  if (!event) return

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'event_registration',
    title: `Registered: ${event.title}`,
    body: `${new Date(event.event_date).toLocaleDateString()} · ${event.location || 'Venue TBD'}`,
    metadata: { event_id: eventId, qr_code: qrCode },
    is_read: false,
    is_archived: false,
  })
}

/* ─────────────────────────────────────────
   INBOX / MESSAGES
───────────────────────────────────────── */

export async function getInbox(userId: string) {
  const supabase = createClient()
  // Get all conversations the user is an active member of
  const { data: memberships } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', userId)
    .eq('invite_status', 'accepted')

  if (!memberships?.length) return []

  const convIds = memberships.map(m => m.conversation_id)

  const { data, error } = await supabase
    .from('messages')
    .select(`
      id, body, created_at, conversation_id,
      sender:profiles!messages_sender_id_fkey(id, full_name)
    `)
    .in('conversation_id', convIds)
    .eq('is_deleted', false)
    .neq('sender_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) { console.error(error); return [] }

  return (data || []).map(m => ({
    ...m,
    sender_name: (m.sender as any)?.full_name ?? 'Unknown',
  }))
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string
) {
  const supabase = createClient()

  // Verify sender is an active member
  const { data: membership } = await supabase
    .from('conversation_members')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', senderId)
    .eq('invite_status', 'accepted')
    .single()

  if (!membership) return { error: 'Not a member of this conversation' }

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: senderId,
    body,
  })

  if (error) return { error: error.message }
  return { success: true }
}

/* ─────────────────────────────────────────
   DM INVITES
───────────────────────────────────────── */

export async function sendDMInvite(fromId: string, toId: string) {
  const supabase = createClient()

  // Create conversation
  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .insert({ type: 'dm', status: 'pending', created_by: fromId })
    .select('id')
    .single()

  if (convErr || !conv) return { error: convErr?.message || 'Failed to create conversation' }

  // Add both members
  await supabase.from('conversation_members').insert([
    { conversation_id: conv.id, user_id: fromId, role: 'admin', invite_status: 'accepted' },
    { conversation_id: conv.id, user_id: toId, role: 'member', invite_status: 'pending' },
  ])

  // Get sender's name for notification
  const { data: sender } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', fromId)
    .single()

  // Notify the recipient
  await supabase.from('notifications').insert({
    user_id: toId,
    type: 'dm_invite',
    title: `${sender?.full_name || 'Someone'} wants to message you`,
    body: 'Accept or decline this DM request.',
    metadata: { conversation_id: conv.id, from_user_id: fromId, from_name: sender?.full_name },
    is_read: false,
    is_archived: false,
  })

  return { success: true, conversationId: conv.id }
}

export async function respondToInvite(
  notificationId: string,
  conversationId: string,
  status: 'accepted' | 'declined'
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Update membership status
  await supabase
    .from('conversation_members')
    .update({ invite_status: status })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)

  // If accepted, activate the conversation
  if (status === 'accepted') {
    await supabase
      .from('conversations')
      .update({ status: 'active' })
      .eq('id', conversationId)
  }

  // Archive the notification
  await supabase
    .from('notifications')
    .update({ is_archived: true, is_read: true })
    .eq('id', notificationId)

  revalidatePath('/')
  return { success: true }
}

/* ─────────────────────────────────────────
   USER SEARCH (for DM / group invite)
───────────────────────────────────────── */

export async function searchUsers(query: string, excludeUserId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, usn, department')
    .neq('id', excludeUserId)
    .neq('role', 'deleted')
    .or(`full_name.ilike.%${query}%,usn.ilike.%${query}%`)
    .limit(8)

  if (error) return []
  return data || []
}

/* ─────────────────────────────────────────
   ADMIN BROADCAST
───────────────────────────────────────── */

export async function sendBroadcast(
  adminId: string,
  subject: string,
  body: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient()

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .single()

  if (profile?.role !== 'admin') return { error: 'Unauthorized: admin role required' }

  // Insert broadcast record
  const { data: broadcast, error: bErr } = await supabase
    .from('broadcasts')
    .insert({ sender_id: adminId, subject, body })
    .select('id')
    .single()

  if (bErr) return { error: bErr.message }

  // Fan out to all active users
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .neq('role', 'deleted')

  if (!users?.length) return { success: true }

  const notifications = users.map(u => ({
    user_id: u.id,
    type: 'broadcast' as const,
    title: subject,
    body,
    metadata: { broadcast_id: broadcast.id },
    is_read: false,
    is_archived: false,
  }))

  // Insert in batches of 100 to avoid payload limits
  for (let i = 0; i < notifications.length; i += 100) {
    await supabase.from('notifications').insert(notifications.slice(i, i + 100))
  }

  return { success: true }
}
