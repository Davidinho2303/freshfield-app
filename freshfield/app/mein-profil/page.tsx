'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HalmIcon } from '@/components/ui/HalmIcon'
import type { Profile, Work } from '@/lib/types'

export default function MeinProfilPage() {
  const [ready, setReady] = useState(false)
  const [favProfiles, setFavProfiles] = useState<Profile[]>([])
  const [favWorks, setFavWorks] = useState<Work[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth/login'; return }

      // Favorisierte Aussteller
      const { data: favs } = await supabase
        .from('favorites')
        .select('profile_id')
        .eq('user_id', user.id)

      const profileIds = favs?.map(f => f.profile_id) ?? []

      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', profileIds)
        setFavProfiles(profiles ?? [])
      }

      // Favorisierte Werke
      const { data: likes } = await supabase
        .from('work_likes')
        .select('work_id')
        .eq('user_id', user.id)

      const workIds = likes?.map(l => l.work_id) ?? []

      if (workIds.length > 0) {
        const { data: works } = await supabase
          .from('works')
          .select('*, profile:profiles(name, slug)')
          .in('id', workIds)
          .order('published_at', { ascending: false })
        setFavWorks((works as any) ?? [])
      }

      setReady(true)
    }
    load()
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <p className="text-sm text-soft tracking-widest uppercase">Wird geladen…</p>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      <header className="sticky top-0 z-40 px-10 py-5 flex justify-between items-center border-b border-line backdrop-blur-md" style={{ background: 'rgba(247,245,242,.85)' }}>
        <Link href="/feed" className="flex items-center gap-2 no-underline">
          <HalmIcon variant="light" />
          <span className="logo-text text-ink">Freshfield</span>
        </Link>
        <div className="flex items-center gap-8">
          <Link href="/feed" className="text-xs text-soft tracking-widest uppercase hover:text-ink transition-colors">← Entdecken</Link>
          <button onClick={signOut} className="text-xs text-soft tracking-widest uppercase hover:text-ink transition-colors">Ausloggen</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-10 py-16 flex flex-col gap-16">

        {/* Favorisierte Aussteller */}
        <section>
          <p className="text-xs tracking-widest uppercase text-soft mb-6">Favorisierte Aussteller</p>
          {favProfiles.length === 0 ? (
            <p className="text-sm text-soft italic">Noch keine Aussteller favorisiert.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {favProfiles.map(p => (
                <Link key={p.id} href={`/profil/${p.slug}`} className="flex items-center gap-4 border border-line px-5 py-4 hover:border-ink transition-colors no-underline group">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-line flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full border border-line flex-shrink-0 flex items-center justify-center font-serif text-soft">
                      {p.name[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm group-hover:text-ink transition-colors">{p.name}</p>
                    {p.bio && <p className="text-xs text-soft mt-0.5 line-clamp-1">{p.bio}</p>}
                  </div>
                  <span className="text-xs text-soft group-hover:text-ink transition-colors">→</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Favorisierte Werke */}
        <section>
          <p className="text-xs tracking-widest uppercase text-soft mb-6">Geliebte Werke</p>
          {favWorks.length === 0 ? (
            <p className="text-sm text-soft italic">Noch keine Werke geliked.</p>
          ) : (
            <div className="feed-grid">
              {favWorks.map((work, i) => (
                <Link key={work.id} href={`/werk/${work.id}`} className="feed-card card-in block no-underline" style={{ animationDelay: `${i * 0.04}s` }}>
                  {work.file_type === 'image' && work.file_url ? (
                    <img src={work.file_url} alt={work.title ?? ''} loading="lazy" />
                  ) : (
                    <div className="w-full flex items-center justify-center text-bg/30 text-4xl" style={{ background: 'var(--ink)', aspectRatio: '4/3' }}>
                      {work.file_type === 'audio' ? '♪' : '▶'}
                    </div>
                  )}
                  <div className="feed-overlay">
                    <span className="text-xs font-serif text-bg/90 block mb-0.5">{work.title ?? 'Ohne Titel'}</span>
                    {(work as any).profile?.name && (
                      <span className="text-[10px] tracking-widest uppercase text-bg/50">{(work as any).profile.name}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
