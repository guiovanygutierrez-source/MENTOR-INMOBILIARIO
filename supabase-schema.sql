-- Mentor Inmobiliario: un documento de avance por usuario.
-- Ejecutar una sola vez en Supabase Dashboard > SQL Editor > New query.
create table if not exists public.user_learning_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_learning_progress_object check (jsonb_typeof(progress) = 'object')
);

alter table public.user_learning_progress enable row level security;
grant usage on schema public to authenticated;
revoke all on table public.user_learning_progress from anon;
grant select, insert, update, delete on table public.user_learning_progress to authenticated;

drop policy if exists "Users can read their own learning progress" on public.user_learning_progress;
create policy "Users can read their own learning progress"
  on public.user_learning_progress for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own learning progress" on public.user_learning_progress;
create policy "Users can create their own learning progress"
  on public.user_learning_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own learning progress" on public.user_learning_progress;
create policy "Users can update their own learning progress"
  on public.user_learning_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own learning progress" on public.user_learning_progress;
create policy "Users can delete their own learning progress"
  on public.user_learning_progress for delete to authenticated
  using ((select auth.uid()) = user_id);
