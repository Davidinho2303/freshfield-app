'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ProfileClient from '@/components/ProfileClient'

export default function ProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const [ready, setReady] = useState(false)
  const [props, setProps] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: profile } = await supabase.from('profiles').select('*').eq('slug', slug).single()
      if (!profile) { window.location.href = '/404'; return }
      const { data: works } = await supabase.from('works').select('*').eq('profile_id', profile.id).order('published_at', { ascending: false })
      const { data: { user } } = await supabase.auth.getUser()
      const { data: favorite } = user
        ? await supabase.from('favorites').select('profile_id').eq('user_id', user.id).eq('profile_id', profile.id).single()
        : { data: null }
      setProps({ profile, works: works ?? [], userId: user?.id ?? null, isFavorited: !!favorite })
      setReady(true)
    }
    load()
  }, [slug])

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <p className="text-sm text-soft tracking-widest uppercase">Wird geladen…</p>
    </div>
  )

  return <ProfileClient {...props} subscriberCount={0} />
}
