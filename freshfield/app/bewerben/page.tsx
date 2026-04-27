'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HalmIcon } from '@/components/ui/HalmIcon'

export default function BewerbenPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!email.trim() || !message.trim()) return
    setLoading(true)

    const supabase = createClient()

    // Bewerbung immer speichern (Aufzeichnung)
    const { data: application } = await supabase
      .from('applications')
      .insert({ email: email.trim(), message: message.trim() })
      .select('id')
      .single()

    // Auto-Approve wenn Flag gesetzt
    if (process.env.NEXT_PUBLIC_AUTO_APPROVE === 'true' && application?.id) {
      await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: application.id, email: email.trim() }),
      })
    }

    setDone(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="px-10 py-5 flex justify-between items-center border-b border-line">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <HalmIcon variant="light" />
          <span className="logo-text text-ink">Freshfield</span>
        </Link>
        <Link href="/" className="text-xs text-soft tracking-widest uppercase hover:text-ink transition-colors">← Zurück</Link>
      </header>

      <div className="max-w-lg mx-auto px-10 py-24">
        {done ? (
          <div className="flex flex-col gap-4">
            <p className="font-serif text-3xl">Danke.</p>
            <p className="text-sm text-soft leading-relaxed">
              {process.env.NEXT_PUBLIC_AUTO_APPROVE === 'true'
                ? 'Du wurdest aufgenommen. Schau in dein Postfach – dort findest du deinen Login-Link.'
                : 'Wir haben deine Bewerbung erhalten und melden uns per E-Mail.'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-12">
              <p className="text-xs tracking-widest uppercase text-soft mb-3">Aussteller werden</p>
              <h1 className="font-serif text-3xl font-normal leading-snug mb-4">Zeig uns was du machst.</h1>
              <p className="text-sm text-soft leading-relaxed">Kein Formular mit Pflichtfeldern. Schreib einfach was du machst — ein Link zu bestehenden Werken hilft, ist aber kein Muss.</p>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <label className="text-xs tracking-widest uppercase text-soft block mb-2">Deine E-Mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="deine@mail.de"
                  className="w-full bg-transparent border-b border-line py-2 text-sm outline-none focus:border-ink transition-colors placeholder:text-soft"
                />
              </div>
              <div>
                <label className="text-xs tracking-widest uppercase text-soft block mb-2">Was machst du?</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Erzähl uns von deiner Arbeit. Links sind willkommen."
                  rows={6}
                  className="w-full bg-transparent border border-line p-3 text-sm leading-relaxed outline-none resize-none focus:border-ink transition-colors placeholder:text-soft"
                />
              </div>
              <button
                onClick={submit}
                disabled={loading || !email.trim() || !message.trim()}
                className="self-start text-xs tracking-widest uppercase bg-ink text-bg px-8 py-3 disabled:opacity-30 transition-opacity"
              >
                {loading ? '…' : 'Bewerbung senden'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
