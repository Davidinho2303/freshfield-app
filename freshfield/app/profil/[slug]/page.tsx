import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProfileClient from '@/components/ProfileClient'

export default async function ProfilePage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!profile) notFound()

  const { data: works } = await supabase
    .from('works')
    .select('*')
    .eq('profile_id', profile.id)
    .order('published_at', { ascending: false })

  const { data: { user } } = await supabase.auth.getUser()

  const { data: favorite } = user ? await supabase
    .from('favorites')
    .select('profile_id')
    .eq('user_id', user.id)
    .eq('profile_id', profile.id)
    .single() : { data: null }

  return (
    <ProfileClient
      profile={profile}
      works={works ?? []}
      userId={user?.id ?? null}
      isFavorited={!!favorite}
      subscriberCount={0}
    />
  )
}
