CREATE TABLE applications (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  message text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

alter table applications enable row level security;
create policy "Anyone can apply" on applications for insert with check (true);
create policy "Service role manages applications" on applications for all using (auth.role() = 'service_role');
