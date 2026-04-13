'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NewsletterBlock, NewsletterBlockType, Profile, Work } from '@/lib/types'
import { HalmIcon } from '@/components/ui/HalmIcon'
import { BlockEditor, BlockPreview } from '@/components/NewsletterBlocks'

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

export default function NewsletterEditorEdit({ newsletterId }: { newsletterId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [works, setWorks] = useState<Work[]>([])
  const [subject, setSubject] = useState('')
  const [blocks, setBlocks] = useState<NewsletterBlock[]>([])
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
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

      const { data: newsletter } = await supabase
        .from('newsletters')
        .select('*')
        .eq('id', newsletterId)
        .eq('profile_id', profileData.id)
        .single()

      if (!newsletter) { router.push(`/profil/${profileData.slug}`); return }

      setSubject(newsletter.subject ?? '')
      setBlocks(newsletter.blocks ?? [])

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
      const workContext = block.work_id ? works.find(w => w.id === block.work_id) : null
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

  async function save() {
    setSaving(true)
    await supabase.from('newsletters').update({ subject, blocks }).eq('id', newsletterId)
    setSaving(false)
    router.push(`/profil/${profile!.slug}`)
  }

  async function sendNewsletter() {
    if (!subject.trim()) { alert('Bitte Betreff eingeben.'); return }
    if (blocks.length === 0) { alert('Bitte mindestens einen Block hinzufügen.'); return }
    if (!window.confirm('Newsletter an alle Abonnenten senden?')) return
    setSending(true)
    await supabase.from('newsletters').update({ subject, blocks }).eq('id', newsletterId)
    const res = await fetch('/api/newsletter/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newsletter_id: newsletterId }),
    })
    const result = await res.json()
    setSending(false)
    if (res.ok) {
      alert(`Versendet an ${result.sent} Abonnenten.`)
      router.push(`/profil/${profile!.slug}`)
    } else {
      alert(`Fehler: ${result.error}`)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center">
      <p className="text-sm text-[#9a9690]">Lädt…</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f7f5f2]">
      <header className="border-b border-[#e8e4de] bg-[#f7f5f2] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HalmIcon size={16} />
            <span className="text-xs uppercase tracking-widest text-[#9a9690]">Newsletter bearbeiten</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={saving || sending}
              className="text-xs uppercase tracking-widest text-[#9a9690] border border-[#dedad5] px-4 py-2 hover:border-[#2d6a2d] hover:text-[#2d6a2d] transition-colors disabled:opacity-50"
            >
              {saving ? 'Speichert…' : 'Speichern'}
            </button>
            <button
              onClick={sendNewsletter}
              disabled={saving || sending}
              className="text-xs uppercase tracking-widest text-[#2d6a2d] border border-[#2d6a2d] px-4 py-2 hover:bg-[#2d6a2d] hover:text-white transition-colors disabled:opacity-50"
            >
              {sending ? 'Sendet…' : 'Senden'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        <div>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Betreff…"
            className="w-full bg-transparent border-b border-[#dedad5] pb-3 mb-8 text-xl font-light text-[#1a1a18] placeholder-[#c5c0ba] outline-none focus:border-[#2d6a2d] transition-colors"
          />
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
