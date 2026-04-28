'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HalmIcon } from '@/components/ui/HalmIcon'

const MEDIUMS = ['Fotografie', 'Visuelle Kunst', 'Zeichnung', 'Malerei', 'Sound', 'Ambient', 'Loop', 'Video', 'Performance', 'Installation']

export default function ProfileSetupClient({ userId }: { userId: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [mediums, setMediums] = useState<string[]>([])
  const [slugError, setSlugError] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  function toSlug(val: string) {
    return val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40)
  }

  function handleNameChange(val: string) {
    setName(val)
    if (!slug || slug === toSlug(name)) {
      setSlug(toSlug(val))
    }
  }

  async function checkSlug(val: string) {
    setSlugError('')
    if (!val) return
    const { data } = await supabase.from('profiles').select('id').eq('slug', val).single()
    if (data) setSlugError('Dieser Name ist bereits vergeben.')
  }

  function toggleMedium(m: string) {
    setMediums(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  async function save() {
    if (!name.trim() || !slug.trim() || slugError) return
    setSaving(true)
    const { error } = await supabase.from('profiles').insert({
      user_id: userId,
      name: name.trim(),
      slug: slug.trim(),
      bio: bio.trim() || null,
      website_url: website.trim() || null,
      medium_tags: mediums,
    })
    if (error) {
      if (error.message.includes('unique')) setSlugError('Dieser Name ist bereits vergeben.')
      setSaving(false)
      return
    }
    router.push(`/profil/${slug}`)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="px-5 md:px-10 py-5 md:py-6 flex justify-between items-center border-b border-line">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <HalmIcon variant="light" />
          <span className="logo-text text-ink">Freshfield</span>
        </Link>
      </header>

      <div className="max-w-lg mx-auto px-5 md:px-6 py-12 md:py-16">
        <p className="text-xs tracking-widest uppercase text-soft mb-4">Profil einrichten</p>
        <h1 className="font-serif text-3xl md:text-4xl font-normal leading-tight mb-2">
          Wie willst du<br />
          <em className="text-soft">hier heißen?</em>
        </h1>
        <p className="text-sm leading-relaxed mb-10 md:mb-12" style={{ color: '#5a5855' }}>
          Kein Klarname nötig. Du kannst auch ein Pseudonym verwenden.
        </p>

        <div className="flex flex-col gap-8">
          <div>
            <label className="text-xs tracking-widest uppercase text-soft mb-2 block">Name *</label>
            <input
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="z.B. Anna K. oder Studio Licht"
              className="w-full bg-transparent border-b border-line py-2 text-base outline-none focus:border-ink transition-colors placeholder:text-soft"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs tracking-widest uppercase text-soft mb-2 block">Profil-URL *</label>
            <div className="flex items-center border-b border-line focus-within:border-ink transition-colors overflow-hidden">
              <span className="text-soft text-xs pb-2 whitespace-nowrap hidden sm:inline">freshfield-app.vercel.app/profil/</span>
              <span className="text-soft text-xs pb-2 whitespace-nowrap sm:hidden">…/profil/</span>
              <input
                value={slug}
                onChange={e => { setSlug(toSlug(e.target.value)); setSlugError('') }}
                onBlur={() => checkSlug(slug)}
                placeholder="dein-name"
                className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-soft min-w-0"
              />
            </div>
            {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
          </div>

          <div>
            <label className="text-xs tracking-widest uppercase text-soft mb-2 block">Bio <span className="opacity-50">(optional)</span></label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Ein paar Sätze über dich und deine Arbeit."
              maxLength={300}
              className="w-full bg-transparent border border-line p-3 text-sm leading-relaxed outline-none resize-none h-24 focus:border-ink transition-colors placeholder:text-soft"
            />
            <p className="text-xs text-soft text-right mt-1">{300 - bio.length} übrig</p>
          </div>

          <div>
            <label className="text-xs tracking-widest uppercase text-soft mb-3 block">Was machst du? <span className="opacity-50">(optional)</span></label>
            <div className="flex flex-wrap gap-2">
              {MEDIUMS.map(m => (
                <button
                  key={m}
                  onClick={() => toggleMedium(m)}
                  className={`text-xs px-3 py-1.5 border transition-all ${mediums.includes(m) ? 'border-ink text-ink bg-ink/5' : 'border-line text-soft hover:border-ink hover:text-ink'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs tracking-widest uppercase text-soft mb-2 block">Website <span className="opacity-50">(optional)</span></label>
            <input
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="https://deine-website.de"
              type="url"
              className="w-full bg-transparent border-b border-line py-2 text-sm outline-none focus:border-ink transition-colors placeholder:text-soft"
            />
          </div>

          <button
            onClick={save}
            disabled={saving || !name.trim() || !slug.trim() || !!slugError}
            className="btn-primary disabled:opacity-30 mt-4"
          >
            {saving ? 'Wird gespeichert…' : 'Profil erstellen →'}
          </button>
        </div>
      </div>
    </div>
  )
}
