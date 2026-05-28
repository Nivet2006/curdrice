-- supabase/migrations/0011_event_discussions.sql
-- Event Discussion Threads (Discord-like group chat per event)

-- ─── events: add discussion toggle ───────────────────────────
alter table events add column if not exists discussion_enabled boolean default false;

-- ─── conversations: link to event ────────────────────────────
alter table conversations add column if not exists event_id text references events(id) on delete set null;
create index if not exists conversations_event_id_idx on conversations(event_id);

-- ─── messages: reply threading ───────────────────────────────
alter table messages add column if not exists reply_to_id uuid references messages(id) on delete set null;

-- ─── message_reactions ───────────────────────────────────────
create table if not exists message_reactions (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid references messages(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,
  emoji       text not null,
  created_at  timestamptz default now(),
  unique(message_id, user_id, emoji)
);

create index if not exists reactions_message_idx on message_reactions(message_id);
create index if not exists reactions_user_idx on message_reactions(user_id);

-- ─── RLS ─────────────────────────────────────────────────────
alter table message_reactions enable row level security;

-- Anyone who can read messages in a conversation can see reactions
create policy "read reactions" on message_reactions
  for select using (
    message_id in (
      select m.id from messages m
      inner join conversation_members cm on cm.conversation_id = m.conversation_id
      where cm.user_id = auth.uid() and cm.invite_status = 'accepted'
    )
  );

-- Members can add/remove their own reactions
create policy "toggle own reaction" on message_reactions
  for insert with check (
    auth.uid() = user_id and
    message_id in (
      select m.id from messages m
      inner join conversation_members cm on cm.conversation_id = m.conversation_id
      where cm.user_id = auth.uid() and cm.invite_status = 'accepted'
    )
  );

create policy "remove own reaction" on message_reactions
  for delete using (auth.uid() = user_id);

-- ─── REALTIME ────────────────────────────────────────────────
alter publication supabase_realtime add table message_reactions;
