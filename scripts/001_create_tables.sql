-- Users/Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  created_at timestamp with time zone default now()
);

-- Workspaces table
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Telegram bots table
create table if not exists public.telegram_bots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bot_token text not null unique,
  bot_name text not null,
  bot_username text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Bot flows (automation sequences)
create table if not exists public.bot_flows (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.telegram_bots(id) on delete cascade,
  name text not null,
  description text,
  trigger_type text not null, -- 'message', 'command', 'callback'
  trigger_value text not null, -- the command or keyword
  flow_data jsonb not null, -- stores the visual flow definition
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Flow nodes (individual steps in a flow)
create table if not exists public.flow_nodes (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references public.bot_flows(id) on delete cascade,
  node_id text not null, -- visual node identifier
  node_type text not null, -- 'message', 'condition', 'action', 'delay'
  config jsonb not null, -- node-specific configuration
  position_x integer,
  position_y integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Flow connections (edges between nodes)
create table if not exists public.flow_connections (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references public.bot_flows(id) on delete cascade,
  source_node_id text not null,
  target_node_id text not null,
  label text, -- for conditional branches
  created_at timestamp with time zone default now()
);

-- Conversations (chat history)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.telegram_bots(id) on delete cascade,
  telegram_user_id bigint not null,
  telegram_user_name text,
  first_name text,
  last_name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Messages (individual messages in conversations)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  flow_execution_id uuid,
  message_type text not null, -- 'incoming', 'outgoing'
  content text not null,
  telegram_message_id bigint,
  created_at timestamp with time zone default now()
);

-- Flow executions (tracks each time a flow is triggered)
create table if not exists public.flow_executions (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references public.bot_flows(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  status text default 'in_progress', -- 'in_progress', 'completed', 'failed'
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  error_message text
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.telegram_bots enable row level security;
alter table public.bot_flows enable row level security;
alter table public.flow_nodes enable row level security;
alter table public.flow_connections enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.flow_executions enable row level security;

-- RLS Policies for profiles
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- RLS Policies for workspaces
create policy "workspaces_select_own" on public.workspaces for select using (auth.uid() = user_id);
create policy "workspaces_insert_own" on public.workspaces for insert with check (auth.uid() = user_id);
create policy "workspaces_update_own" on public.workspaces for update using (auth.uid() = user_id);
create policy "workspaces_delete_own" on public.workspaces for delete using (auth.uid() = user_id);

-- RLS Policies for telegram_bots (through workspace)
create policy "telegram_bots_select" on public.telegram_bots for select
  using (workspace_id in (select id from public.workspaces where user_id = auth.uid()));
create policy "telegram_bots_insert" on public.telegram_bots for insert
  with check (workspace_id in (select id from public.workspaces where user_id = auth.uid()));
create policy "telegram_bots_update" on public.telegram_bots for update
  using (workspace_id in (select id from public.workspaces where user_id = auth.uid()));
create policy "telegram_bots_delete" on public.telegram_bots for delete
  using (workspace_id in (select id from public.workspaces where user_id = auth.uid()));

-- RLS Policies for bot_flows (through workspace)
create policy "bot_flows_select" on public.bot_flows for select
  using (bot_id in (select id from public.telegram_bots where workspace_id in (select id from public.workspaces where user_id = auth.uid())));
create policy "bot_flows_insert" on public.bot_flows for insert
  with check (bot_id in (select id from public.telegram_bots where workspace_id in (select id from public.workspaces where user_id = auth.uid())));
create policy "bot_flows_update" on public.bot_flows for update
  using (bot_id in (select id from public.telegram_bots where workspace_id in (select id from public.workspaces where user_id = auth.uid())));
create policy "bot_flows_delete" on public.bot_flows for delete
  using (bot_id in (select id from public.telegram_bots where workspace_id in (select id from public.workspaces where user_id = auth.uid())));

-- RLS Policies for flow_nodes (through flow_id -> bot_id -> workspace)
create policy "flow_nodes_select" on public.flow_nodes for select
  using (flow_id in (select id from public.bot_flows where bot_id in (select id from public.telegram_bots where workspace_id in (select id from public.workspaces where user_id = auth.uid()))));
create policy "flow_nodes_insert" on public.flow_nodes for insert
  with check (flow_id in (select id from public.bot_flows where bot_id in (select id from public.telegram_bots where workspace_id in (select id from public.workspaces where user_id = auth.uid()))));
create policy "flow_nodes_update" on public.flow_nodes for update
  using (flow_id in (select id from public.bot_flows where bot_id in (select id from public.telegram_bots where workspace_id in (select id from public.workspaces where user_id = auth.uid()))));
create policy "flow_nodes_delete" on public.flow_nodes for delete
  using (flow_id in (select id from public.bot_flows where bot_id in (select id from public.telegram_bots where workspace_id in (select id from public.workspaces where user_id = auth.uid()))));

-- RLS Policies for flow_connections (similar to flow_nodes)
create policy "flow_connections_select" on public.flow_connections for select
  using (flow_id in (select id from public.bot_flows where bot_id in (select id from public.telegram_bots where workspace_id in (select id from public.workspaces where user_id = auth.uid()))));
create policy "flow_connections_insert" on public.flow_connections for insert
  with check (flow_id in (select id from public.bot_flows where bot_id in (select id from public.telegram_bots where workspace_id in (select id from public.workspaces where user_id = auth.uid()))));
create policy "flow_connections_delete" on public.flow_connections for delete
  using (flow_id in (select id from public.bot_flows where bot_id in (select id from public.telegram_bots where workspace_id in (select id from public.workspaces where user_id = auth.uid()))));

-- RLS Policies for conversations (accessible to anyone for now, we'll validate via bot association)
create policy "conversations_select" on public.conversations for select
  using (bot_id in (select id from public.telegram_bots where workspace_id in (select id from public.workspaces where user_id = auth.uid())));
create policy "conversations_insert" on public.conversations for insert
  with check (bot_id in (select id from public.telegram_bots where workspace_id in (select id from public.workspaces where user_id = auth.uid())));

-- RLS Policies for messages (through conversation)
create policy "messages_select" on public.messages for select
  using (conversation_id in (select id from public.conversations where bot_id in (select id from public.telegram_bots where workspace_id in (select id from public.workspaces where user_id = auth.uid()))));
create policy "messages_insert" on public.messages for insert
  with check (conversation_id in (select id from public.conversations where bot_id in (select id from public.telegram_bots where workspace_id in (select id from public.workspaces where user_id = auth.uid()))));

-- RLS Policies for flow_executions (through conversation)
create policy "flow_executions_select" on public.flow_executions for select
  using (conversation_id in (select id from public.conversations where bot_id in (select id from public.telegram_bots where workspace_id in (select id from public.workspaces where user_id = auth.uid()))));
create policy "flow_executions_insert" on public.flow_executions for insert
  with check (conversation_id in (select id from public.conversations where bot_id in (select id from public.telegram_bots where workspace_id in (select id from public.workspaces where user_id = auth.uid()))));
