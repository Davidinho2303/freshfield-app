'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HalmIcon } from '@/components/ui/HalmIcon'
import type { Work, Comment } from '@/lib/types'

interface Props {
  work: Work & { profile: any }
  comments: Comment[]
  userId: string | null
  isLiked: boolean
  likesCount: number
  commentsOpen: boolean
}

export default function WerkClient({ work, comments: initComments, userId, isLiked: initLiked, likesCount: initCount, commentsOpen }: Props) {
  const [liked, setLiked] = useState(initLiked)
  const [count, setCount] = useState(initCount)
  const [comments, setComments] = useState<Comment[]>(initComments)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const remaining = 140 - body.trim().length

  async function toggleLike() {
    if (!userId) { window.location.href = '/auth/login'; return }
    setLiked(l => !l)
    setCount(c => liked ? c - 1 : c + 1)
    if (liked) {
      await supabase.from('work_likes').delete().match({ user_id: userId, work_id: work.id })
    } else {
      await supabase.from('work_likes').insert({ user_id: userId, work_id: work.id })
    }
  }

  async function submitComment() {
    if (!userId || !body.trim() || body.trim().length > 140) return
    setSubmitting(true)
    const { data, error } = await supabase
      .from('comments')
      .insert({ work_id: work.id, user_id: userId, body: body.trim() })
      .select()
      .single()
    if (!error && data) {
      setComments(c => [data, ...c])
      setBody('')
    }
    setSubmitting(false)
  }

  // Time until comments open
  const commentsOpenAt = work.published_at ? new Date(new Date(work.published_at).getTime() + 24 * 60 * 60 * 1000) : null
  const hoursLeft = commentsOpenAt ? Math.max(0, Math.ceil((commentsOpenAt.getTime() - Date.now()) / 3600000)) : 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-40 px-10 py-5 flex justify-between items-center border-b border-line backdrop-blur-md" style={{ background: 'rgba(247,245,242,.92)' }}>
        <Link href="/" className="flex items-center gap-2 no-underline">
          <HalmIcon variant="light" />
          <span className="logo-text text-ink">Freshfield</span>
        </Link>
        <div className="flex gap-8 text-xs tracking-widest uppercase text-soft">
          <Link href="/feed" className="hover:text-ink transition-colors">← Entdecken</Link>
          {work.profile && (
            <Link href={`/profil/${work.profile.slug}`} className="hover:text-ink transition-colors">← Zum Profil</Link>
          )}
        </div>
      </header>

      <div className="grid" style={{ gridTemplateColumns: '1fr 420px', minHeight: 'calc(100vh - 57px)' }}>
        {/* Left: werk display */}
        <div className="sticky top-14 flex items-center justify-center overflow-hidden" style={{ background: 'var(--ink)', height: 'calc(100vh - 57px)' }}>
          {work.file_type === 'image' && work.file_url ? (
            <img src={work.file_url} alt={work.title ?? ''} className="w-full h-full object-contain" />
          ) : work.file_type === 'audio' ? (
            <div className="flex flex-col items-center gap-6 p-12 w-full max-w-sm">
              <p className="font-serif text-2xl text-bg text-center">{work.title ?? 'Ohne Titel'}</p>
              <div className="w-full h-0.5 bg-white/10 rounded" />
              <p className="text-xs text-white/40 tracking-widest uppercase">Audio</p>
            </div>
          ) : (
            <div className="text-white/20 text-6xl">▶</div>
          )}
        </div>

        {/* Right: info + comments */}
        <div className="border-l border-line flex flex-col overflow-y-auto" style={{ height: 'calc(100vh - 57px)' }}>
          <div className="p-10 flex flex-col gap-0">
            {/* Artist */}
            {work.profile && (
              <Link href={`/profil/${work.profile.slug}`} className="flex items-center gap-3 pb-6 mb-6 border-b border-line no-underline group">
                {work.profile.avatar_url ? (
                  <img src={work.profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-line" />
                ) : (
                  <div className="w-9 h-9 rounded-full border border-line flex items-center justify-center text-sm font-serif text-soft">{work.profile.name[0]}</div>
                )}
                <div>
                  <div className="text-sm text-ink group-hover:opacity-70 transition-opacity">{work.profile.name}</div>
                  <div className="text-xs text-soft tracking-widest uppercase mt-0.5">Profil ansehen →</div>
                </div>
              </Link>
            )}

            {/* Title */}
            {work.title && <h1 className="font-serif text-4xl font-normal leading-tight mb-2">{work.title}</h1>}
            {(work.medium || work.year) && (
              <p className="text-xs tracking-widest uppercase text-soft mb-6">{[work.medium, work.year].filter(Boolean).join(' · ')}</p>
            )}
            {work.description && (
              <p className="text-sm leading-relaxed mb-8 pb-8 border-b border-line" style={{ color: '#5a5855' }}>{work.description}</p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-line">
              <button onClick={toggleLike}
                className={`w-11 h-11 border flex items-center justify-center text-base transition-all ${liked ? 'bg-ink text-bg border-ink' : 'border-line text-soft hover:border-ink hover:text-ink'}`}>
                {liked ? '♥' : '♡'}
              </button>
              <span className="text-xs text-soft">{count} mal geschätzt</span>
              <button
                onClick={() => navigator.clipboard?.writeText(window.location.href)}
                className="ml-auto text-xs tracking-widest uppercase px-4 py-2 border border-line text-soft hover:border-ink hover:text-ink transition-all"
              >
                Teilen
              </button>
            </div>

            {/* Comments */}
            <div className="text-xs tracking-widest uppercase text-soft mb-5">Kommentare</div>

            {!commentsOpen ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <KoalaSVG />
                <p className="text-xs text-soft leading-relaxed">
                  Kommentare öffnen in<br />
                  <strong className="text-ink font-normal">{hoursLeft} Stunden</strong>
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-5 mb-6">
                  {comments.length === 0 && (
                    <p className="text-xs text-soft italic">Noch keine Kommentare.</p>
                  )}
                  {comments.map(c => (
                    <div key={c.id} className="border-l-2 border-line pl-4">
                      <p className="text-sm leading-relaxed text-ink mb-1.5">{c.body}</p>
                      <p className="text-xs text-soft tracking-wide">{new Date(c.created_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  ))}
                </div>

                {userId ? (
                  <div className="border-t border-line pt-5">
                    <label className="text-xs tracking-widest uppercase text-soft mb-3 block">Dein Kommentar</label>
                    <textarea
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      placeholder="Was beschäftigt dich an diesem Werk?"
                      maxLength={160}
                      className="w-full bg-transparent border border-line p-3 text-sm leading-relaxed outline-none resize-none h-24 focus:border-ink transition-colors placeholder:text-soft"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs ${remaining < 0 ? 'text-red-500' : remaining <= 20 ? 'text-amber-600' : 'text-soft'}`}>
                        {remaining < 0 ? `${Math.abs(remaining)} zu viel` : `${remaining} übrig`}
                      </span>
                      <button
                        onClick={submitComment}
                        disabled={submitting || body.trim().length === 0 || remaining < 0}
                        className="text-xs tracking-widest uppercase bg-ink text-bg px-4 py-2 disabled:opacity-30 transition-opacity"
                      >
                        {submitting ? '…' : 'Senden'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link href="/auth/login" className="text-xs text-soft underline underline-offset-4 hover:text-ink transition-colors">
                    Einloggen um zu kommentieren →
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KoalaSVG() {
  return (
    <svg width="48" height="48" viewBox="0 0 72 72" fill="none" style={{ opacity: .45, filter: 'grayscale(1)' }}>
      <circle cx="14" cy="22" r="11" fill="#b8b2aa"/><circle cx="58" cy="22" r="11" fill="#b8b2aa"/>
      <circle cx="14" cy="22" r="7" fill="#d4cfc9"/><circle cx="58" cy="22" r="7" fill="#d4cfc9"/>
      <ellipse cx="36" cy="40" rx="24" ry="22" fill="#c8c2bc"/>
      <ellipse cx="36" cy="43" rx="7" ry="5" fill="#8a8480"/>
      <path d="M25 35 Q28 32 31 35" stroke="#5a5450" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
      <path d="M41 35 Q44 32 47 35" stroke="#5a5450" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
      <path d="M30 50 Q36 54 42 50" stroke="#8a8480" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    </svg>
  )
}
