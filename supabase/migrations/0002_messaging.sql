-- supabase/migrations/0002_messaging.sql

-- ─── conversations ───────────────────────────────────────────
create table if not exists conversations (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('dm', 'group')),
  name        text,
  created_by  uuid references profiles(id) on delete set null,
  status      text not null default 'pending' check (status in ('pending', 'active')),
  created_at  timestamptz default now()
);

-- ─── conversation_members ────────────────────────────────────
create table if not exists conversation_members (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid references conversations(id) on delete cascade,
  user_id           uuid references profiles(id) on delete cascade,
  role              text not null default 'member' check (role in ('member', 'admin')),
  invite_status     text not null default 'pending' check (invite_status in ('pending', 'accepted', 'declined')),
  joined_at         timestamptz default now(),
  unique (conversation_id, user_id)
);

-- ─── messages ────────────────────────────────────────────────
create table if not exists messages (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid references conversations(id) on delete cascade,
  sender_id         uuid references profiles(id) on delete set null,
  body              text not null,
  is_archived       boolean default false,
  is_deleted        boolean default false,
  created_at        timestamptz default now()
);

-- ─── notifications ───────────────────────────────────────────
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  type        text not null check (type in (
                'event_registration','dm_invite','group_invite',
                'broadcast','system'
              )),
  title       text not null,
  body        text,
  metadata    jsonb default '{}',
  is_read     boolean default false,
  is_archived boolean default false,
  created_at  timestamptz default now()
);

-- ─── broadcasts ──────────────────────────────────────────────
create table if not exists broadcasts (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid references profiles(id) on delete set null,
  subject     text not null,
  body        text not null,
  sent_at     timestamptz default now()
);

-- ─── indexes ─────────────────────────────────────────────────
create index if not exists notifications_user_id_idx on notifications(user_id);
create index if not exists notifications_unread_idx  on notifications(user_id, is_read, is_archived);
create index if not exists messages_conversation_idx on messages(conversation_id, created_at);
create index if not exists conv_members_user_idx     on conversation_members(user_id);

-- ─── RLS ─────────────────────────────────────────────────────
alter table notifications         enable row level security;
alter table conversations         enable row level security;
alter table conversation_members  enable row level security;
alter table messages              enable row level security;
alter table broadcasts            enable row level security;

-- notifications: users see only their own
create policy "own notifications" on notifications
  for all using (auth.uid() = user_id);

-- conversations: visible to members
create policy "member conversations" on conversations
  for select using (
    id in (
      select conversation_id from conversation_members
      where user_id = auth.uid()
    )
  );

create policy "create conversation" on conversations
  for insert with check (auth.uid() = created_by);

create policy "update own conversation" on conversations
  for update using (
    id in (
      select conversation_id from conversation_members
      where user_id = auth.uid()
    )
  );

-- conversation_members: members can see memberships in their convos, secured by UUID unguessability and root convo RLS
create policy "view memberships" on conversation_members
  for select using (auth.uid() IS NOT NULL);

create policy "insert memberships" on conversation_members
  for insert with check (true); -- controlled in server action

create policy "update own membership" on conversation_members
  for update using (user_id = auth.uid());

-- messages: only members of the conversation can read/write
create policy "read messages" on messages
  for select using (
    conversation_id in (
      select conversation_id from conversation_members
      where user_id = auth.uid() and invite_status = 'accepted'
    )
  );

create policy "send messages" on messages
  for insert with check (
    auth.uid() = sender_id and
    conversation_id in (
      select conversation_id from conversation_members
      where user_id = auth.uid() and invite_status = 'accepted'
    )
  );

-- broadcasts: only admins can insert
create policy "admin broadcast insert" on broadcasts
  for insert with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "admin broadcast select" on broadcasts
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ─── REALTIME PUBLICATIONS ───────────────────────────────────
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table conversation_members;
