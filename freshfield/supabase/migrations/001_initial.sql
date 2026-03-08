-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES ──────────────────────────────────────────────────────────────────
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique,
  slug text unique not null,
  name text not null,
  bio text,
  avatar_url text,
  website_url text,
  medium_tags text[] default '{}',
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Profiles are public" on profiles for select using (true);
create policy "Users manage own profile" on profiles for all using (auth.uid() = user_id);

-- ── WORKS ─────────────────────────────────────────────────────────────────────
create table works (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade not null,
  title text,
  year text,
  medium text,
  description text,
  tags text[] default '{}',
  file_url text not null,
  file_type text check (file_type in ('image','audio','video')) not null,
  thumbnail_url text,
  published_at timestamptz,
  scheduled_for timestamptz,
  is_draft boolean default false,
  deep_dives integer default 0,
  created_at timestamptz default now()
);
alter table works enable row level security;
create policy "Published works are public" on works for select
  using (published_at is not null and published_at <= now() and is_draft = false);
create policy "Profile owners manage works" on works for all
  using (profile_id in (select id from profiles where user_id = auth.uid()));

-- ── COMMENTS ──────────────────────────────────────────────────────────────────
create table comments (
  id uuid primary key default uuid_generate_v4(),
  work_id uuid references works(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  body text not null check (char_length(body) <= 140),
  created_at timestamptz default now()
);
alter table comments enable row level security;
create policy "Comments visible on open works" on comments for select
  using (
    work_id in (
      select id from works
      where published_at is not null
        and published_at <= now() - interval '24 hours'
        and is_draft = false
    )
  );
create policy "Authenticated users can comment" on comments for insert
  with check (auth.uid() = user_id);
create policy "Users delete own comments" on comments for delete
  using (auth.uid() = user_id);

-- ── LIKES ─────────────────────────────────────────────────────────────────────
create table work_likes (
  user_id uuid references auth.users(id) on delete cascade,
  work_id uuid references works(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, work_id)
);
alter table work_likes enable row level security;
create policy "Likes are public" on work_likes for select using (true);
create policy "Auth users can like" on work_likes for insert with check (auth.uid() = user_id);
create policy "Users unlike own" on work_likes for delete using (auth.uid() = user_id);

-- ── FAVORITES ─────────────────────────────────────────────────────────────────
create table favorites (
  user_id uuid references auth.users(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, profile_id)
);
alter table favorites enable row level security;
create policy "Favorites are private" on favorites for select using (auth.uid() = user_id);
create policy "Auth users can favorite" on favorites for insert with check (auth.uid() = user_id);
create policy "Users unfavorite own" on favorites for delete using (auth.uid() = user_id);

-- ── NEWSLETTER ────────────────────────────────────────────────────────────────
create table newsletter_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade not null,
  email text not null,
  confirmed boolean default false,
  token text unique default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz default now(),
  unique(profile_id, email)
);
alter table newsletter_subscriptions enable row level security;
create policy "Anyone can subscribe" on newsletter_subscriptions for insert with check (true);
create policy "Confirm by token" on newsletter_subscriptions for update using (true);

-- ── STORAGE ───────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('works', 'works', true);
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

create policy "Works are public" on storage.objects for select using (bucket_id = 'works');
create policy "Authenticated upload works" on storage.objects for insert
  with check (bucket_id = 'works' and auth.role() = 'authenticated');
create policy "Avatars are public" on storage.objects for select using (bucket_id = 'avatars');
create policy "Authenticated upload avatars" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- ── DEEP DIVE COUNTER (called from app) ───────────────────────────────────────
create or replace function increment_deep_dive(work_id uuid)
returns void language sql security definer as $$
  update works set deep_dives = deep_dives + 1 where id = work_id;
$$;
