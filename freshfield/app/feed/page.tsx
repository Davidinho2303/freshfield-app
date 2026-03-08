import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FeedClient from '@/components/FeedClient'
import type { Work } from '@/lib/types'

export default async function FeedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: works } = await supabase
    .from('works')
    .select('*, profile:profiles(id, slug, name, avatar_url)')
    .order('published_at', { ascending: false })
    .limit(60)

  const { data: favorites } = await supabase
    .from('favorites')
    .select('profile_id')
    .eq('user_id', user.id)

  const { data: likes } = await supabase
    .from('work_likes')
    .select('work_id')
    .eq('user_id', user.id)

  return (
    <FeedClient
      initialWorks={(works as Work[]) ?? []}
      favoriteIds={(favorites ?? []).map(f => f.profile_id)}
      likedIds={(likes ?? []).map(l => l.work_id)}
      userId={user.id}
    />
  )
}
