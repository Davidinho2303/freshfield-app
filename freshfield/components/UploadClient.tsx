'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HalmIcon } from '@/components/ui/HalmIcon'
import type { Profile } from '@/lib/types'

interface Props {
  profile: Profile
  userId: string
}

export default function UploadClient({ profile, userId }: Props) {
  const [step, setStep] = useState(1)
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [title, setTitle] = useState('')
  const [year, setYear] = useState('')
  const [medium, setMedium] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [scheduled, setScheduled] = useState(false)
  const [schedDate, setSchedDate] = useState('')
  const [schedTime, setSchedTime] = useState('20:00')
  const [isDraft, setIsDraft] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith('image/') || f.type.startsWith('audio/') || f.type.startsWith('video/')
    )
    setFiles(prev => [...prev, ...dropped])
  }, [])

  function fileType(f: File): 'image' | 'audio' | 'video' {
    if (f.type.startsWith('image/')) return 'image'
    if (f.type.startsWith('audio/')) return 'audio'
    return 'video'
  }

  async function publish() {
    if (files.length === 0) return
    setUploading(true)

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}.${ext}`

      const { data: upload, error: uploadError } = await supabase.storage
        .from('works')
        .upload(path, file)

      if (uploadError || !upload) continue

      const { data: { publicUrl } } = supabase.storage.from('works').getPublicUrl(path)

      const publishedAt = isDraft ? null
        : scheduled && schedDate ? new Date(`${schedDate}T${schedTime || '20:00'}`).toISOString()
        : new Date().toISOString()

      await supabase.from('works').insert({
        profile_id: profile.id,
        title: title || null,
        year: year || null,
        medium: medium || null,
        description: description || null,
        tags,
        file_url: publicUrl,
        file_type: fileType(file),
        published_at: publishedAt,
        scheduled_for: scheduled && schedDate ? new Date(`${schedDate}T${schedTime}`).toISOString() : null,
        is_draft: isDraft,
      })
    }

    setUploading(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center max-w-sm px-6">
          <h1 className="font-serif text-4xl font-normal mb-4">Werk ist unterwegs.</h1>
          <p className="text-sm text-soft leading-relaxed mb-8">Kommentare öffnen in 24 Stunden. Bis dahin schläft der Koala.</p>
          <Link href={`/profil/${profile.slug}`}>
            <button className="btn-primary">Zum Profil</button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-40 px-10 py-5 flex justify-between items-center border-b border-line backdrop-blur-md" style={{ background: 'rgba(247,245,242,.92)' }}>
        <Link href="/" className="flex items-center gap-2 no-underline">
          <HalmIcon variant="light" />
          <span className="logo-text text-ink">Freshfield</span>
        </Link>
        <div className="flex items-center gap-8">
          {[1, 2, 3].map(s => (
            <span key={s} className={`text-xs tracking-widest uppercase ${step === s ? 'text-ink' : 'text-soft'}`}>
              {s === 1 ? 'Dateien' : s === 2 ? 'Details' : 'Veröffentlichen'}
            </span>
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Step 1: Upload */}
        {step === 1 && (
          <div>
            <h1 className="font-serif text-3xl font-normal mb-2">Werk hochladen</h1>
            <p className="text-sm text-soft mb-8">Bild, Audio oder Video. Mehrere Dateien möglich.</p>

            {files.length === 0 ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-none py-20 flex flex-col items-center gap-4 transition-colors cursor-pointer ${dragging ? 'border-ink bg-ink/5' : 'border-line hover:border-ink/40'}`}
                onClick={() => document.getElementById('fileIn')?.click()}
              >
                <span className="text-3xl text-soft">+</span>
                <p className="text-sm text-soft text-center">Dateien hierher ziehen<br /><span className="text-xs">oder klicken zum Auswählen</span></p>
                <p className="text-xs text-soft/60">JPG, PNG, WEBP, MP3, WAV, FLAC, MP4, MOV</p>
                <input id="fileIn" type="file" multiple accept="image/*,audio/*,video/*" className="hidden"
                  onChange={e => setFiles(Array.from(e.target.files ?? []))} />
              </div>
            ) : (
              <div className="flex flex-col gap-3 mb-8">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-4 border border-line p-4">
                    {f.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(f)} alt="" className="w-16 h-16 object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 bg-ink flex items-center justify-center text-bg text-xl flex-shrink-0">
                        {f.type.startsWith('audio/') ? '♪' : '▶'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{f.name}</p>
                      <p className="text-xs text-soft">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-soft hover:text-ink text-lg leading-none">✕</button>
                  </div>
                ))}
                <button onClick={() => document.getElementById('fileIn')?.click()} className="text-xs text-soft underline underline-offset-4">
                  Weitere Dateien hinzufügen
                </button>
                <input id="fileIn" type="file" multiple accept="image/*,audio/*,video/*" className="hidden"
                  onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files ?? [])])} />
              </div>
            )}

            <div className="flex justify-end mt-8">
              <button onClick={() => setStep(2)} disabled={files.length === 0}
                className="btn-primary disabled:opacity-30">Weiter →</button>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div>
            <h1 className="font-serif text-3xl font-normal mb-2">Details</h1>
            <p className="text-sm text-soft mb-8">Nur der Titel ist Pflicht.</p>

            <div className="flex flex-col gap-6">
              <div>
                <label className="text-xs tracking-widest uppercase text-soft mb-2 block">Titel</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Wie heißt dieses Werk?"
                  className="w-full bg-transparent border-b border-line py-2 text-base outline-none focus:border-ink transition-colors placeholder:text-soft" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs tracking-widest uppercase text-soft mb-2 block">Jahr <span className="opacity-50">(optional)</span></label>
                  <input value={year} onChange={e => setYear(e.target.value)} placeholder="2024" maxLength={4}
                    className="w-full bg-transparent border-b border-line py-2 text-sm outline-none focus:border-ink transition-colors placeholder:text-soft" />
                </div>
                <div>
                  <label className="text-xs tracking-widest uppercase text-soft mb-2 block">Medium <span className="opacity-50">(optional)</span></label>
                  <select value={medium} onChange={e => setMedium(e.target.value)}
                    className="w-full bg-transparent border-b border-line py-2 text-sm outline-none focus:border-ink transition-colors text-ink appearance-none cursor-pointer">
                    <option value="">– wählen –</option>
                    {['Fotografie','Visuelle Kunst','Zeichnung','Sound','Ambient','Loop','Video'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs tracking-widest uppercase text-soft mb-2 block">Tags <span className="opacity-50">(optional)</span></label>
                <div className="border border-line p-3 flex flex-wrap gap-2 cursor-text" onClick={() => document.getElementById('tagIn')?.focus()}>
                  {tags.map(t => (
                    <button key={t} onClick={() => setTags(tags.filter(x => x !== t))}
                      className="text-xs bg-ink/7 px-2 py-0.5 flex items-center gap-1 hover:bg-ink/15">
                      {t} <span className="text-soft">✕</span>
                    </button>
                  ))}
                  <input id="tagIn" value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { e.preventDefault(); setTags([...tags, tagInput.trim()]); setTagInput('') }}}
                    placeholder="Tag eingeben, Enter bestätigen"
                    className="bg-transparent outline-none text-xs flex-1 min-w-24 placeholder:text-soft" />
                </div>
              </div>
              <div>
                <label className="text-xs tracking-widest uppercase text-soft mb-2 block">Werktext <span className="opacity-50">(optional)</span></label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Ein paar Sätze zum Werk."
                  className="w-full bg-transparent border border-line p-3 text-sm leading-relaxed outline-none resize-none h-28 focus:border-ink transition-colors placeholder:text-soft" />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep(1)} className="btn-ghost">← Zurück</button>
              <button onClick={() => setStep(3)} className="btn-primary">Weiter →</button>
            </div>
          </div>
        )}

        {/* Step 3: Publish */}
        {step === 3 && (
          <div>
            <h1 className="font-serif text-3xl font-normal mb-2">Veröffentlichen</h1>
            <p className="text-sm text-soft mb-8">Wann soll das Werk sichtbar sein?</p>

            {/* Preview */}
            <div className="border border-line p-6 mb-8 flex gap-4 items-start">
              {files[0] && files[0].type.startsWith('image/') ? (
                <img src={URL.createObjectURL(files[0])} alt="" className="w-24 h-24 object-cover flex-shrink-0" />
              ) : (
                <div className="w-24 h-24 bg-ink flex items-center justify-center text-bg text-2xl flex-shrink-0">
                  {files[0]?.type.startsWith('audio/') ? '♪' : '▶'}
                </div>
              )}
              <div>
                <p className="font-serif text-xl">{title || 'Ohne Titel'}</p>
                {medium && <p className="text-xs text-soft tracking-widest uppercase mt-1">{medium}</p>}
                <p className="text-xs text-soft mt-2">{profile.name}</p>
              </div>
            </div>

            {/* Schedule toggle */}
            <div className="border border-line p-5 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm">{scheduled ? 'Geplant' : 'Jetzt veröffentlichen'}</p>
                  <p className="text-xs text-soft mt-0.5">Kommentare öffnen 24h nach Veröffentlichung</p>
                </div>
                <button onClick={() => setScheduled(s => !s)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${scheduled ? 'bg-ink' : 'bg-line'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-bg transition-all ${scheduled ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              {scheduled && (
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-line">
                  <div>
                    <label className="text-xs text-soft mb-1 block">Datum</label>
                    <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                      className="w-full bg-transparent border-b border-line py-1.5 text-sm outline-none focus:border-ink" />
                  </div>
                  <div>
                    <label className="text-xs text-soft mb-1 block">Uhrzeit</label>
                    <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                      className="w-full bg-transparent border-b border-line py-1.5 text-sm outline-none focus:border-ink" />
                  </div>
                </div>
              )}
            </div>

            {/* Draft option */}
            <button onClick={() => setIsDraft(d => !d)}
              className={`w-full border p-5 text-left transition-all mb-8 ${isDraft ? 'border-ink' : 'border-line'}`}>
              <p className="text-sm">{isDraft ? '✓ ' : ''}Als Entwurf speichern</p>
              <p className="text-xs text-soft mt-0.5">Nur du siehst das Werk.</p>
            </button>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="btn-ghost">← Zurück</button>
              <button onClick={publish} disabled={uploading}
                className="btn-primary disabled:opacity-40">
                {uploading ? 'Wird hochgeladen…' : isDraft ? 'Als Entwurf speichern' : 'Veröffentlichen'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
