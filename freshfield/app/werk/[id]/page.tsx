import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import WerkClient from '@/components/WerkClient'

export default async function WerkPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: work } = await supabase
    .from('works')
    .select('*, profile:profiles(*)')
    .eq('id', params.id)
    .single()

  if (!work) notFound()

  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('work_id', work.id)
    .order('created_at', { ascending: false })

  const { data: { user } } = await supabase.auth.getUser()

  const { data: likeRow } = user ? await supabase
    .from('work_likes')
    .select('work_id')
    .eq('user_id', user.id)
    .eq('work_id', work.id)
    .single() : { data: null }

  const { data: likesCount } = await supabase
    .from('work_likes')
    .select('*', { count: 'exact', head: true })
    .eq('work_id', work.id)

  // Check if comments are open (published_at + 24h)
  const commentsOpen = work.published_at
    ? Date.now() - new Date(work.published_at).getTime() > 24 * 60 * 60 * 1000
    : false

  return (
    <WerkClient
      work={work}
      comments={comments ?? []}
      userId={user?.id ?? null}
      isLiked={!!likeRow}
      likesCount={likesCount ?? 0}
      commentsOpen={commentsOpen}
    />
  )
}
