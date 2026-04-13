'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NewsletterBlock, NewsletterBlockType, Profile, Work } from '@/lib/types'
import { HalmIcon } from '@/components/ui/HalmIcon'

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

const BLOCK_LABELS: Record<NewsletterBlockType, string> = {
  text: 'Text',
  h1: 'Überschrift 1',
  h2: 'Überschrift 2',
  list: 'Liste',
  quote: 'Zitat',
  divider: 'Trennlinie',
  button: 'Button / CTA',
  image: 'Bild',
  work: 'Werk einbetten',
  video: 'Video (YouTube/Vimeo)',
}

export default function NewsletterEditor() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [works, setWorks] = useState<Work[]>([])
  const [subject, setSubject] = useState('')
  const [blocks, setBlocks] = useState<NewsletterBlock[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [claudeLoading, setClaudeLoading] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!profileData) { router.push('/'); return }
      setProfile(profileData)

      const { data: worksData } = await supabase
        .from('works')
        .select('*')
        .eq('profile_id', profileData.id)
        .eq('is_draft', false)
        .order('published_at', { ascending: false })

      setWorks(worksData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function addBlock(type: NewsletterBlockType) {
    const block: NewsletterBlock = { id: generateId(), type }
    if (type === 'list') block.items = ['']
    if (type === 'button') { block.label = ''; block.url = '' }
    setBlocks(prev => [...prev, block])
  }

  function updateBlock(id: string, changes: Partial<NewsletterBlock>) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...changes } : b))
  }

  function moveBlock(id: string, dir: -1 | 1) {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id)
      if (idx < 0) return prev
      const next = [...prev]
      const swap = idx + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  function removeBlock(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  async function suggestWithClaude(block: NewsletterBlock) {
    if (!profile) return
    setClaudeLoading(block.id)
    try {
      const workContext = block.work_id
        ? works.find(w => w.id === block.work_id)
        : null

      const prompt = `Du bist Assistent für Künstler auf der Plattform Freshfield.
Aussteller: ${profile.name}
Bio: ${profile.bio ?? 'keine'}
Medium: ${profile.medium_tags?.join(', ') ?? 'unbekannt'}
${workContext ? `Werk: "${workContext.title}" (${workContext.medium}, ${workContext.year})\nBeschreibung: ${workContext.description ?? 'keine'}` : ''}

Schreibe einen kurzen, authentischen Text für einen Newsletter-Block vom Typ "${BLOCK_LABELS[block.type]}".
${block.type === 'text' ? 'Max. 3 Sätze. Persönlich, keine Werbung.' : ''}
${block.type === 'h1' || block.type === 'h2' ? 'Nur die Überschrift, kein weiterer Text.' : ''}
${block.type === 'quote' ? 'Ein prägnantes Zitat oder einen Gedanken.' : ''}
${block.type === 'button' ? 'Antworte mit JSON: {"label": "...", "url": ""}' : ''}
${block.type === 'list' ? 'Antworte mit JSON: {"items": ["...", "...", "..."]}' : ''}
Antworte nur mit dem Text, keine Erklärung.`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      const text = data.content?.[0]?.text ?? ''

      if (block.type === 'button' || block.type === 'list') {
        try {
          const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
          if (block.type === 'button') updateBlock(block.id, { label: parsed.label, url: parsed.url ?? '' })
          if (block.type === 'list') updateBlock(block.id, { items: parsed.items })
        } catch { updateBlock(block.id, { content: text }) }
      } else {
        updateBlock(block.id, { content: text })
      }
    } finally {
      setClaudeLoading(null)
    }
  }

  async function saveDraft() {
    if (!profile) return
    setSaving(true)
    await supabase.from('newsletters').insert({
      profile_id: profile.id,
      subject,
      blocks,
      status: 'draft',
    })
    setSaving(false)
    router.push(`/profil/${profile.slug}`)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center">
      <p className="text-sm text-[#9a9690]">Lädt…</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f7f5f2]">
      {/* Header */}
      <header className="border-b border-[#e8e4de] bg-[#f7f5f2] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
           <HalmIcon size={16} />
            <span className="text-xs uppercase tracking-widest text-[#9a9690]">Newsletter</span>
          </div>
          <button
            onClick={saveDraft}
            disabled={saving}
            className="text-xs uppercase tracking-widest text-[#2d6a2d] border border-[#2d6a2d] px-4 py-2 hover:bg-[#2d6a2d] hover:text-white transition-colors disabled:opacity-50"
          >
            {saving ? 'Speichert…' : 'Entwurf speichern'}
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        {/* Editor */}
        <div>
          {/* Betreff */}
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Betreff…"
            className="w-full bg-transparent border-b border-[#dedad5] pb-3 mb-8 text-xl font-light text-[#1a1a18] placeholder-[#c5c0ba] outline-none focus:border-[#2d6a2d] transition-colors"
          />

          {/* Blöcke */}
          <div className="space-y-4">
            {blocks.map((block, idx) => (
              <BlockEditor
                key={block.id}
                block={block}
                idx={idx}
                total={blocks.length}
                works={works}
                claudeLoading={claudeLoading === block.id}
                onUpdate={changes => updateBlock(block.id, changes)}
                onMove={dir => moveBlock(block.id, dir)}
                onRemove={() => removeBlock(block.id)}
                onSuggest={() => suggestWithClaude(block)}
              />
            ))}
          </div>

          {/* Block hinzufügen */}
          <div className="mt-8">
            <p className="text-xs uppercase tracking-widest text-[#9a9690] mb-3">Block hinzufügen</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(BLOCK_LABELS) as NewsletterBlockType[]).map(type => (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
                  className="text-xs border border-[#dedad5] px-3 py-1.5 text-[#5a5855] hover:border-[#2d6a2d] hover:text-[#2d6a2d] transition-colors"
                >
                  + {BLOCK_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Vorschau */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <p className="text-xs uppercase tracking-widest text-[#9a9690] mb-4">Vorschau</p>
          <div className="border border-[#e8e4de] bg-white p-6 text-sm font-sans max-h-[75vh] overflow-y-auto">
            {subject && <p className="text-xs text-[#9a9690] mb-4 pb-4 border-b border-[#e8e4de]">Betreff: {subject}</p>}
            {blocks.length === 0 && <p className="text-[#c5c0ba] text-xs">Noch keine Blöcke…</p>}
            {blocks.map(block => <BlockPreview key={block.id} block={block} works={works} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Block Editor ──────────────────────────────────────────

function BlockEditor({ block, idx, total, works, claudeLoading, onUpdate, onMove, onRemove, onSuggest }: {
  block: NewsletterBlock
  idx: number
  total: number
  works: Work[]
  claudeLoading: boolean
  onUpdate: (c: Partial<NewsletterBlock>) => void
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
  onSuggest: () => void
}) {
  return (
    <div className="border border-[#e8e4de] bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest text-[#9a9690]">{BLOCK_LABELS[block.type]}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onSuggest}
            disabled={claudeLoading}
            className="text-xs text-[#2d6a2d] border border-[#2d6a2d] px-2 py-0.5 hover:bg-[#2d6a2d] hover:text-white transition-colors disabled:opacity-40"
          >
            {claudeLoading ? '…' : '✦ Vorschlag'}
          </button>
          <button onClick={() => onMove(-1)} disabled={idx === 0} className="text-[#9a9690] hover:text-[#1a1a18] disabled:opacity-20 text-sm px-1">↑</button>
          <button onClick={() => onMove(1)} disabled={idx === total - 1} className="text-[#9a9690] hover:text-[#1a1a18] disabled:opacity-20 text-sm px-1">↓</button>
          <button onClick={onRemove} className="text-[#9a9690] hover:text-red-400 text-sm px-1">×</button>
        </div>
      </div>

      {/* Divider */}
      {block.type === 'divider' && (
        <p className="text-xs text-[#c5c0ba]">— Trennlinie —</p>
      )}

      {/* Text / H1 / H2 / Quote */}
      {(block.type === 'text' || block.type === 'h1' || block.type === 'h2' || block.type === 'quote') && (
        <textarea
          value={block.content ?? ''}
          onChange={e => onUpdate({ content: e.target.value })}
          placeholder={block.type === 'quote' ? 'Zitat…' : 'Text…'}
          rows={block.type === 'text' ? 4 : 2}
          className="w-full bg-[#faf9f7] border border-[#e8e4de] px-3 py-2 text-sm text-[#1a1a18] outline-none focus:border-[#2d6a2d] resize-none placeholder-[#c5c0ba]"
        />
      )}

      {/* List */}
      {block.type === 'list' && (
        <div className="space-y-2">
          {(block.items ?? ['']).map((item, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={item}
                onChange={e => {
                  const items = [...(block.items ?? [])]
                  items[i] = e.target.value
                  onUpdate({ items })
                }}
                placeholder={`Punkt ${i + 1}…`}
                className="flex-1 bg-[#faf9f7] border border-[#e8e4de] px-3 py-1.5 text-sm text-[#1a1a18] outline-none focus:border-[#2d6a2d] placeholder-[#c5c0ba]"
              />
              <button
                onClick={() => {
                  const items = (block.items ?? []).filter((_, j) => j !== i)
                  onUpdate({ items: items.length ? items : [''] })
                }}
                className="text-[#9a9690] hover:text-red-400 text-sm px-1"
              >×</button>
            </div>
          ))}
          <button
            onClick={() => onUpdate({ items: [...(block.items ?? []), ''] })}
            className="text-xs text-[#2d6a2d] hover:underline"
          >+ Punkt hinzufügen</button>
        </div>
      )}

      {/* Button */}
      {block.type === 'button' && (
        <div className="space-y-2">
          <input value={block.label ?? ''} onChange={e => onUpdate({ label: e.target.value })} placeholder="Button-Text…" className="w-full bg-[#faf9f7] border border-[#e8e4de] px-3 py-1.5 text-sm text-[#1a1a18] outline-none focus:border-[#2d6a2d] placeholder-[#c5c0ba]" />
          <input value={block.url ?? ''} onChange={e => onUpdate({ url: e.target.value })} placeholder="URL…" className="w-full bg-[#faf9f7] border border-[#e8e4de] px-3 py-1.5 text-sm text-[#1a1a18] outline-none focus:border-[#2d6a2d] placeholder-[#c5c0ba]" />
        </div>
      )}

      {/* Image */}
      {block.type === 'image' && (
        <div className="space-y-2">
          <input value={block.src ?? ''} onChange={e => onUpdate({ src: e.target.value })} placeholder="Bild-URL…" className="w-full bg-[#faf9f7] border border-[#e8e4de] px-3 py-1.5 text-sm text-[#1a1a18] outline-none focus:border-[#2d6a2d] placeholder-[#c5c0ba]" />
          <input value={block.caption ?? ''} onChange={e => onUpdate({ caption: e.target.value })} placeholder="Bildunterschrift…" className="w-full bg-[#faf9f7] border border-[#e8e4de] px-3 py-1.5 text-sm text-[#1a1a18] outline-none focus:border-[#2d6a2d] placeholder-[#c5c0ba]" />
        </div>
      )}

      {/* Work */}
      {block.type === 'work' && (
        <select
          value={block.work_id ?? ''}
          onChange={e => onUpdate({ work_id: e.target.value })}
          className="w-full bg-[#faf9f7] border border-[#e8e4de] px-3 py-1.5 text-sm text-[#1a1a18] outline-none focus:border-[#2d6a2d]"
        >
          <option value="">Werk wählen…</option>
          {works.map(w => (
            <option key={w.id} value={w.id}>{w.title ?? 'Ohne Titel'} ({w.year ?? '—'})</option>
          ))}
        </select>
      )}

      {/* Video */}
      {block.type === 'video' && (
        <input value={block.video_url ?? ''} onChange={e => onUpdate({ video_url: e.target.value })} placeholder="YouTube oder Vimeo URL…" className="w-full bg-[#faf9f7] border border-[#e8e4de] px-3 py-1.5 text-sm text-[#1a1a18] outline-none focus:border-[#2d6a2d] placeholder-[#c5c0ba]" />
      )}
    </div>
  )
}

// ── Block Preview ─────────────────────────────────────────

function BlockPreview({ block, works }: { block: NewsletterBlock; works: Work[] }) {
  switch (block.type) {
    case 'h1': return <h1 className="text-2xl font-light text-[#1a1a18] mb-4">{block.content || <span className="text-[#c5c0ba]">Überschrift 1</span>}</h1>
    case 'h2': return <h2 className="text-lg font-light text-[#1a1a18] mb-3">{block.content || <span className="text-[#c5c0ba]">Überschrift 2</span>}</h2>
    case 'text': return <p className="text-sm text-[#3a3835] mb-4 leading-relaxed">{block.content || <span className="text-[#c5c0ba]">Text…</span>}</p>
    case 'quote': return <blockquote className="border-l-2 border-[#2d6a2d] pl-4 mb-4 italic text-sm text-[#5a5855]">{block.content || <span className="text-[#c5c0ba]">Zitat…</span>}</blockquote>
    case 'divider': return <hr className="border-[#e8e4de] my-4" />
    case 'list': return (
      <ul className="mb-4 space-y-1">
        {(block.items ?? []).filter(Boolean).map((item, i) => (
          <li key={i} className="text-sm text-[#3a3835] flex gap-2"><span className="text-[#2d6a2d]">—</span>{item}</li>
        ))}
      </ul>
    )
    case 'button': return (
      <div className="mb-4">
        <span className="inline-block border border-[#2d6a2d] text-[#2d6a2d] text-xs uppercase tracking-widest px-4 py-2">
          {block.label || 'Button'}
        </span>
      </div>
    )
    case 'image': return (
      <div className="mb-4">
        {block.src ? <img src={block.src} alt={block.caption ?? ''} className="w-full" /> : <div className="bg-[#f0ede8] h-32 flex items-center justify-center text-xs text-[#c5c0ba]">Bild</div>}
        {block.caption && <p className="text-xs text-[#9a9690] mt-1">{block.caption}</p>}
      </div>
    )
    case 'work': {
      const work = works.find(w => w.id === block.work_id)
      return (
        <div className="mb-4 border border-[#e8e4de] p-3">
          {work ? (
            <>
              {work.thumbnail_url && <img src={work.thumbnail_url} alt={work.title ?? ''} className="w-full h-24 object-cover mb-2" />}
              <p className="text-sm font-medium text-[#1a1a18]">{work.title}</p>
              <p className="text-xs text-[#9a9690]">{work.medium} · {work.year}</p>
            </>
          ) : <p className="text-xs text-[#c5c0ba]">Werk wählen…</p>}
        </div>
      )
    }
    case 'video': return (
      <div className="mb-4 bg-[#f0ede8] h-24 flex items-center justify-center text-xs text-[#9a9690]">
        {block.video_url ? block.video_url : 'Video URL…'}
      </div>
    )
    default: return null
  }
}
