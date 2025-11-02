-- Add agent assignment and read status to conversations
alter table if exists public.conversations add column if not exists assigned_agent_id uuid;
alter table if exists public.conversations add column if not exists is_archived boolean default false;

-- Add read status to messages
alter table if exists public.messages add column if not exists is_read boolean default false;
alter table if exists public.messages add column if not exists edited_at timestamp with time zone;

-- Add timeout tracking for data collection
alter table if exists public.flow_executions add column if not exists current_node_id text;
alter table if exists public.flow_executions add column if not exists timeout_at timestamp with time zone;
alter table if exists public.flow_executions add column if not exists timeout_path text; -- 'timeout' or 'response'

-- Create agent assignments table
create table if not exists public.agent_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_name text not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS for agent_assignments
alter table public.agent_assignments enable row level security;

create policy "agent_assignments_select" on public.agent_assignments for select
  using (workspace_id in (select id from public.workspaces where user_id = auth.uid()));
create policy "agent_assignments_insert" on public.agent_assignments for insert
  with check (workspace_id in (select id from public.workspaces where user_id = auth.uid()));
create policy "agent_assignments_update" on public.agent_assignments for update
  using (workspace_id in (select id from public.workspaces where user_id = auth.uid()));
create policy "agent_assignments_delete" on public.agent_assignments for delete
  using (workspace_id in (select id from public.workspaces where user_id = auth.uid()));
