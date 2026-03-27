'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import WerkClient from '@/components/WerkClient'

export default function WerkPage() {
  const { id } = useParams<{ id: string }>()
  const [ready, setReady] = useState(false)
  const [props, setProps] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: work } = await supabase.from('works').select('*, profile:profiles(*)').eq('id', id).single()
      if (!work) { window.location.href = '/404'; return }
      const { data: comments } = await supabase.from('comments').select('*').eq('work_id', work.id).order('created_at', { ascending: false })
      const { data: { user } } = await supabase.auth.getUser()
      const { data: likeRow } = user
        ? await supabase.from('work_likes').select('work_id').eq('user_id', user.id).eq('work_id', work.id).single()
        : { data: null }
      const { count: likesCount } = await supabase.from('work_likes').select('*', { count: 'exact', head: true }).eq('work_id', work.id)
      const commentsOpen = work.published_at ? Date.now() - new Date(work.published_at).getTime() > 24 * 60 * 60 * 1000 : false
      setProps({ work, comments: comments ?? [], userId: user?.id ?? null, isLiked: !!likeRow, likesCount: likesCount ?? 0, commentsOpen })
      setReady(true)
    }
    load()
  }, [id])

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <p className="text-sm text-soft tracking-widest uppercase">Wird geladen…</p>
    </div>
  )

  return <WerkClient {...props} />
}
