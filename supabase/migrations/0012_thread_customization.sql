-- supabase/migrations/0012_thread_customization.sql
-- Thread customization: CC can set thread mode (open/announcement/moderated)

-- ─── events: thread mode ─────────────────────────────────────
-- 'open'          = everyone can send messages (default, Discord-like)
-- 'announcement'  = only CC/admin/manager can send; students can read + react
-- 'moderated'     = students can send but only reactions allowed (no replies to student msgs by students)
alter table events add column if not exists thread_mode text default 'open'
  check (thread_mode in ('open', 'announcement', 'moderated'));

-- ─── messages: pin support ──────────────────────────────────
alter table messages add column if not exists is_pinned boolean default false;
create index if not exists messages_pinned_idx on messages(conversation_id, is_pinned) where is_pinned = true;
