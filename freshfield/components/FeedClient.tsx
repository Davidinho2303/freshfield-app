'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HalmIcon } from '@/components/ui/HalmIcon'
import type { Work } from '@/lib/types'

const ADMIN_ID = '1bc45ad9-5f11-4c12-90a7-b6676e87d35e'

interface Props {
  initialWorks: Work[]
  favoriteIds: string[]
  likedIds: string[]
  userId: string
  userSlug?: string | null
}

export default function FeedClient({ initialWorks, favoriteIds, likedIds, userId, userSlug }: Props) {
  const [works] = useState<Work[]>(initialWorks)
  const [liked, setLiked] = useState<Set<string>>(new Set(likedIds))
  const [medium, setMedium] = useState<'all' | 'image' | 'audio' | 'video'>('all')
  const [pool, setPool] = useState<'all' | 'fav'>('all')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const favSet = new Set(favoriteIds)
  const supabase = createClient()

  const filtered = works.filter(w => {
    if (medium !== 'all' && w.file_type !== medium) return false
    if (pool === 'fav' && w.profile_id && !favSet.has(w.profile_id)) return false
    return true
  })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggleLike = useCallback(async (workId: string) => {
    const isLiked = liked.has(workId)
    setLiked(prev => {
      const next = new Set(prev)
      isLiked ? next.delete(workId) : next.add(workId)
      return next
    })
    if (isLiked) {
      await supabase.from('work_likes').delete().match({ user_id: userId, work_id: workId })
    } else {
      await supabase.from('work_likes').insert({ user_id: userId, work_id: workId })
    }
  }, [liked, userId, supabase])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-40 px-5 md:px-10 py-5 flex justify-between items-center border-b border-line backdrop-blur-md" style={{ background: 'rgba(247,245,242,.92)' }}>
        <Link href="/feed" className="flex items-center gap-2 no-underline">
          <HalmIcon variant="light" />
          <span className="logo-text text-ink">Freshfield</span>
        </Link>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-xs text-soft tracking-widest uppercase hover:text-ink transition-colors flex items-center gap-2"
          >
            Menü <span style={{ fontSize: '8px' }}>{menuOpen ? '▲' : '▼'}</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 border border-line z-50 min-w-[160px]" style={{ background: 'var(--bg)' }}>
              {userSlug && (
                <Link href={`/profil/${userSlug}`} onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-xs tracking-widest uppercase text-soft hover:text-ink hover:bg-line/30 transition-colors no-underline">
                  Mein Profil
                </Link>
              )}
              {userSlug && (
                <Link href="/upload" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-xs tracking-widest uppercase text-soft hover:text-ink hover:bg-line/30 transition-colors no-underline">
                  Werk hochladen
                </Link>
              )}
              {userSlug && (
                <Link href="/newsletter/neu" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-xs tracking-widest uppercase text-soft hover:text-ink hover:bg-line/30 transition-colors no-underline">
                  Newsletter
                </Link>
              )}
              <Link href="/mein-profil" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-xs tracking-widest uppercase text-soft hover:text-ink hover:bg-line/30 transition-colors no-underline">
                Meine Favoriten
              </Link>
              <div className="border-t border-line" />
              <button onClick={signOut} className="w-full text-left px-4 py-3 text-xs tracking-widest uppercase text-soft hover:text-ink hover:bg-line/30 transition-colors">
                Ausloggen
              </button>
              {userId === ADMIN_ID && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-xs tracking-widest uppercase text-soft hover:text-ink hover:bg-line/30 transition-colors no-underline border-t border-line">
                  Admin
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="px-5 md:px-10 py-3 border-b border-line flex gap-2 flex-wrap">
        <span className="text-xs text-soft self-center mr-1">{filtered.length} Werke</span>
        {(['all', 'image', 'audio', 'video'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMedium(m)}
            className={`text-xs tracking-widest uppercase px-2.5 py-1.5 border transition-all ${medium === m ? 'border-ink text-ink' : 'border-line text-soft hover:border-ink hover:text-ink'}`}
          >
            {m === 'all' ? 'Alles' : m === 'image' ? 'Bild' : m === 'audio' ? 'Audio' : 'Video'}
          </button>
        ))}
        <button
          onClick={() => setPool(pool === 'all' ? 'fav' : 'all')}
          className={`text-xs tracking-widest uppercase px-2.5 py-1.5 border transition-all ml-auto ${pool === 'fav' ? 'border-ink text-ink' : 'border-line text-soft hover:border-ink hover:text-ink'}`}
        >
          {pool === 'fav' ? '✓ Favoriten' : 'Favoriten'}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-soft">
          <p className="font-serif text-2xl mb-3">Noch nichts hier.</p>
          <p className="text-sm">Ändere den Filter oder schau später nochmal rein.</p>
        </div>
      ) : (
        <div className="feed-grid">
          {filtered.map((work, i) => (
            <WorkCard key={work.id} work={work} liked={liked.has(work.id)} onLike={toggleLike} delay={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function WorkCard({ work, liked, onLike, delay }: { work: Work; liked: boolean; onLike: (id: string) => void; delay: number }) {
  const isNew = work.published_at && Date.now() - new Date(work.published_at).getTime() < 7 * 24 * 60 * 60 * 1000
  return (
    <div className="feed-card card-in" style={{ animationDelay: `${delay * 0.04}s` }}>
      <Link href={`/werk/${work.id}`}>
        {work.file_type === 'image' && work.file_url ? (
          <img src={work.file_url} alt={work.title ?? ''} loading="lazy" />
        ) : work.thumbnail_url ? (
          <img src={work.thumbnail_url} alt={work.title ?? ''} loading="lazy" />
        ) : (
          <div className="w-full flex items-center justify-center text-bg/30 text-4xl" style={{ background: 'var(--ink)', aspectRatio: '4/3' }}>
            {work.file_type === 'audio' ? '♪' : '▶'}
          </div>
        )}
        <div className="feed-overlay">
          <span className="text-xs font-serif text-bg/90 block mb-0.5">{work.title ?? 'Ohne Titel'}</span>
          {work.profile && (
            <span className="text-[10px] tracking-widest uppercase text-bg/50">{work.profile.name}</span>
          )}
        </div>
      </Link>
      {isNew && (
        <div className="absolute top-2.5 left-2.5 text-[9px] tracking-widest uppercase px-1.5 py-0.5 bg-ink text-bg">Neu</div>
      )}
      <button
        onClick={(e) => { e.preventDefault(); onLike(work.id) }}
        className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${liked ? 'bg-ink text-bg' : 'bg-bg/85 text-ink'}`}
        style={{ opacity: liked ? 1 : undefined }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => { if (!liked) e.currentTarget.style.opacity = '0' }}
      >
        {liked ? '♥' : '♡'}
      </button>
    </div>
  )
}
