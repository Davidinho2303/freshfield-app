'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FeedClient from '@/components/FeedClient'

export default function FeedPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [works, setWorks] = useState<any[]>([])
  const [userId, setUserId] = useState('')
  const [likedIds, setLikedIds] = useState<string[]>([])
 const [favoriteIds, setFavoriteIds] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      setUserId(user.id)

      const { data: works } = await supabase
        .from('works')
        .select('*, profile:profiles(id, slug, name, avatar_url)')
        .order('published_at', { ascending: false })
        .limit(60)

      const { data: likes } = await supabase
        .from('work_likes').select('work_id').eq('user_id', user.id)

      const { data: favs } = await supabase
        .from('favorites').select('profile_id').eq('user_id', user.id)

      setWorks(works ?? [])
      setLikedIds((likes ?? []).map((l: any) => l.work_id))
      setFavoriteIds((favs ?? []).map((f: any) => f.profile_id))
      setReady(true)
    }
    load()
  }, [])

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <p className="text-sm text-soft tracking-widest uppercase">Wird geladen…</p>
    </div>
  )

  return <FeedClient initialWorks={works} favoriteIds={favoriteIds} likedIds={likedIds} userId={userId} />
}
