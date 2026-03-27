'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HalmIcon } from '@/components/ui/HalmIcon'
import type { Profile, Work } from '@/lib/types'

interface Props {
  profile: Profile
  works: Work[]
  userId: string | null
  isFavorited: boolean
  subscriberCount: number
}

export default function ProfileClient({ profile, works, userId, isFavorited: initFav, subscriberCount }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [favorited, setFavorited] = useState(initFav)
  const [nlOpen, setNlOpen] = useState(false)
  const [nlEmail, setNlEmail] = useState('')
  const [nlDone, setNlDone] = useState(false)
  const supabase = createClient()const [userEmail, setUserEmail] = useState<string | null>(null)
useEffect(() => {
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user?.email) setUserEmail(user.email)
  })
}, [])

  const imageWorks = works.filter(w => w.file_type === 'image')
  const audioWorks = works.filter(w => w.file_type === 'audio')
  const hasMultiple = imageWorks.length > 0 && audioWorks.length > 0
  const [tab, setTab] = useState<'image' | 'audio'>('image')

  async function toggleFavorite() {
    if (!userId) { window.location.href = '/auth/login'; return }
    setFavorited(f => !f)
    if (favorited) {
      await supabase.from('favorites').delete().match({ user_id: userId, profile_id: profile.id })
    } else {
      await supabase.from('favorites').insert({ user_id: userId, profile_id: profile.id })
    }
  }

  async function subscribeNewsletter() {
  const email = userEmail || nlEmail.trim()
  if (!email) return
  await supabase.from('newsletter_subscriptions').upsert({
    profile_id: profile.id, email, confirmed: false,
  }, { onConflict: 'profile_id,email' })
  setNlDone(true)
  setMenuOpen(false)
}

  const displayedWorks = hasMultiple
    ? (tab === 'image' ? imageWorks : audioWorks)
    : works

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-10 py-5 flex justify-between items-center border-b border-line backdrop-blur-md" style={{ background: 'rgba(247,245,242,.85)' }}>
        <Link href="/" className="flex items-center gap-2 no-underline">
          <HalmIcon variant="light" />
          <span className="logo-text text-ink">Freshfield</span>
        </Link>
        <Link href="/feed" className="text-xs text-soft tracking-widest uppercase hover:text-ink transition-colors">← Entdecken</Link>
      </header>

      {/* Profile section */}
      <div className="px-10 pt-12 pb-0 flex items-start gap-8">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover border border-line flex-shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-full border border-line flex-shrink-0 flex items-center justify-center text-2xl font-serif text-soft">
            {profile.name[0]}
          </div>
        )}
        <div className="flex-1 pt-1">
          <h1 className="text-2xl font-normal mb-2">{profile.name}</h1>
          {profile.bio && <p className="text-sm leading-relaxed text-[#5a5855] max-w-lg mb-3">{profile.bio}</p>}
          <div className="text-xs text-soft tracking-wide">{works.length} Werke · {subscriberCount} Newsletter-Abonnenten</div>
        </div>

        {/* Actions dropdown */}
        <div className="relative pt-1 flex-shrink-0">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="text-xs tracking-widest uppercase px-4 py-2 border border-line text-soft hover:border-ink hover:text-ink transition-all flex items-center gap-2"
          >
            Behalten <span className="text-[8px]">▾</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-bg border border-line shadow-lg z-50 min-w-[220px] flex flex-col">
              <button
                onClick={toggleFavorite}
                className="px-4 py-3 text-xs tracking-widest uppercase text-left border-b border-line hover:bg-black/5 transition-colors flex items-center gap-3"
                style={{ color: favorited ? 'var(--g1)' : 'var(--soft)' }}
              >
                <span>{favorited ? '♥' : '♡'}</span>
                {favorited ? 'Favorisiert' : 'Favorisieren'}
              </button>

              {!nlDone ? (
                <>
                  <button
                    onClick={() => setNlOpen(o => !o)}
                    className="px-4 py-3 text-xs tracking-widest uppercase text-left border-b border-line hover:bg-black/5 transition-colors flex items-center gap-3 text-soft"
                  >
                    <span>✉</span> Newsletter
                  </button>
                  {nlOpen && (
                    <div className="px-4 py-3 border-b border-line flex flex-col gap-2">
                      <input
                        type="email"
                        value={nlEmail}
                        onChange={e => setNlEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && subscribeNewsletter()}
                        placeholder="deine@mail.de"
                        className="w-full bg-transparent border-b border-line text-xs py-1.5 outline-none placeholder:text-soft"
                        autoFocus
                      />
                     <button onClick={() => userEmail ? subscribeNewsletter() : setNlOpen(o => !o)}
  className="px-4 py-3 text-xs tracking-widest uppercase text-left border-b border-line hover:bg-black/5 transition-colors flex items-center gap-3 text-soft">
  <span>✉</span> Newsletter
</button>
{nlOpen && !userEmail && (
  <div className="px-4 py-3 border-b border-line flex flex-col gap-2">
    <input type="email" value={nlEmail} onChange={e => setNlEmail(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && subscribeNewsletter()}
      placeholder="deine@mail.de"
      className="w-full bg-transparent border-b border-line text-xs py-1.5 outline-none placeholder:text-soft"
      autoFocus />
    <button onClick={subscribeNewsletter}
      className="self-end text-xs tracking-widest uppercase bg-ink text-bg px-3 py-1.5">
      Abonnieren
    </button>
    <span className="text-[10px] text-soft">Kein Account nötig.</span>
  </div>
)}

              {profile.website_url && (
                <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-3 text-xs tracking-widest uppercase text-left hover:bg-black/5 transition-colors flex items-center gap-3 text-soft no-underline">
                  <span>↗</span> Website
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tab bar (only if both types) */}
      {hasMultiple && (
        <div className="flex gap-0 px-10 mt-8 border-b border-line">
          {(['image', 'audio'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-3 mr-6 text-xs tracking-widest uppercase transition-all border-b-2 ${tab === t ? 'border-ink text-ink' : 'border-transparent text-soft hover:text-ink'}`}>
              {t === 'image' ? `Visuell (${imageWorks.length})` : `Audio (${audioWorks.length})`}
            </button>
          ))}
        </div>
      )}

      {/* Works grid */}
      <div className="feed-grid" style={{ paddingTop: '2rem' }}>
        {displayedWorks.map((work, i) => (
          <Link key={work.id} href={`/werk/${work.id}`} className="feed-card card-in block no-underline" style={{ animationDelay: `${i * 0.05}s` }}>
            {work.file_type === 'image' && work.file_url ? (
              <img src={work.file_url} alt={work.title ?? ''} loading="lazy" />
            ) : (
              <div className="w-full flex items-center justify-center text-bg/30 text-4xl" style={{ background: 'var(--ink)', aspectRatio: '4/3' }}>
                {work.file_type === 'audio' ? '♪' : '▶'}
              </div>
            )}
            <div className="feed-overlay">
              <span className="text-xs font-serif text-bg/90 block">{work.title ?? 'Ohne Titel'}</span>
              {work.medium && <span className="text-[10px] tracking-widest uppercase text-bg/50">{work.medium}</span>}
            </div>
          </Link>
        ))}
      </div>

      {/* Close menu on outside click */}
      {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />}
    </div>
  )
}
