'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HalmIcon } from '@/components/ui/HalmIcon'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  async function sendOtp() {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  async function verifyOtp() {
    if (!code.trim()) return
    setVerifying(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'magiclink',
    })
    if (error) {
      setError('Code ungültig oder abgelaufen.')
      setVerifying(false)
    } else {
      router.push('/feed')
      router.refresh()
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
                Wir schicken dir einen 6-stelligen Code. Kein Passwort, kein Profil.
              </p>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendOtp()}
                placeholder="deine@mail.de"
                className="w-full bg-transparent border-b border-line py-2 text-base outline-none focus:border-ink transition-colors placeholder:text-soft mb-6"
                autoFocus
              />
              {error && <p className="text-xs text-red-600 mb-4">{error}</p>}
              <button onClick={sendOtp} disabled={loading || !email.trim()}
                className="btn-primary w-full disabled:opacity-40">
                {loading ? 'Wird gesendet…' : 'Code senden'}
              </button>
            </>
          ) : (
            <>
              <h1 className="font-serif text-4xl font-normal leading-tight mb-3">
                Code eingeben.<br />
                <em className="text-soft">Dann bist du drin.</em>
              </h1>
              <p className="text-sm leading-relaxed mb-10" style={{ color: '#5a5855' }}>
                Wir haben einen 6-stelligen Code an <strong>{email}</strong> geschickt.
              </p>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                placeholder="123456"
                className="w-full bg-transparent border-b border-line py-2 text-2xl tracking-widest outline-none focus:border-ink transition-colors placeholder:text-soft mb-6 text-center"
                autoFocus
                maxLength={6}
              />
              {error && <p className="text-xs text-red-600 mb-4">{error}</p>}
              <button onClick={verifyOtp} disabled={verifying || code.length !== 6}
                className="btn-primary w-full disabled:opacity-40">
                {verifying ? 'Wird geprüft…' : 'Einloggen'}
              </button>
              <button onClick={() => { setSent(false); setCode(''); setError('') }}
                className="mt-4 w-full text-xs text-soft underline underline-offset-4 bg-transparent border-none cursor-pointer">
                Andere E-Mail verwenden
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
