'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HalmIcon } from '@/components/ui/HalmIcon'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/feed`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="px-10 py-6 flex justify-between items-center border-b border-line">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <HalmIcon variant="light" />
          <span className="logo-text text-ink">Freshfield</span>
        </Link>
        <Link href="/" className="text-xs text-soft tracking-widest uppercase hover:text-ink transition-colors">
          ← Zurück
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="text-xs text-soft tracking-widest uppercase mb-6">Zugang</div>

          {!sent ? (
            <>
              <h1 className="font-serif text-4xl font-normal leading-tight mb-3">
                Nur deine E-Mail.<br />
                <em className="text-soft">Sonst nichts.</em>
              </h1>
              <p className="text-sm leading-relaxed mb-10" style={{ color: '#5a5855' }}>
                Kein Name, kein Passwort, kein Profil. Wir schicken dir einen Bestätigungslink — damit bist du drin.
              </p>

              <div className="mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="deine@mail.de"
                  className="input-base"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 mb-4">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !email.trim()}
                className="btn-primary w-full mb-4 disabled:opacity-40"
              >
                {loading ? 'Wird gesendet…' : 'Bestätigungslink senden'}
              </button>

              <p className="text-xs text-soft text-center leading-relaxed">
                Mit dem Absenden stimmst du zu, dass wir dir einen einmaligen Bestätigungslink schicken. Kein Newsletter, kein Tracking.
              </p>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-3xl mb-4">✉</div>
              <h2 className="font-serif text-2xl font-normal mb-3">Link ist unterwegs.</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#5a5855' }}>
                Schau in dein Postfach — der Link ist 24 Stunden gültig.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-8 text-xs text-soft underline underline-offset-4 cursor-pointer bg-transparent border-none"
              >
                Andere E-Mail verwenden
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
