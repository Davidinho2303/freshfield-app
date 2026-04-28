'use client'
import Link from 'next/link'
import { HalmIcon } from '@/components/ui/HalmIcon'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="px-6 md:px-10 py-5 flex justify-between items-center border-b border-line">
        <div className="flex items-center gap-2">
          <HalmIcon variant="light" />
          <span className="logo-text">Freshfield</span>
        </div>
        <nav className="flex gap-4 md:gap-8">
          <Link href="/bewerben" className="text-xs text-soft tracking-widest uppercase hover:text-ink transition-colors">
            Aussteller werden
          </Link>
          <Link href="/ueber" className="text-xs text-soft tracking-widest uppercase hover:text-ink transition-colors hidden sm:block">
            Was ist das hier?
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col md:grid md:grid-cols-2">
        <div className="flex flex-col justify-center px-8 md:px-16 py-14 md:py-20">
          <div className="text-xs text-soft tracking-widest uppercase mb-6 md:mb-8">Ein Raum für Kunst</div>
          <h1 className="font-serif text-4xl md:text-5xl font-normal leading-tight mb-5 md:mb-6">
            Du musst hier<br />
            niemanden beeindrucken.<br />
            <em>Nur schauen.</em>
          </h1>
          <div className="text-sm text-soft leading-relaxed mb-10 md:mb-12 max-w-sm">
            <p className="mb-3">Freshfield ist kein Feed, der dir sagt, was gerade angesagt ist. Kein Algorithmus, der Aufmerksamkeit verkauft.</p>
            <p>Hier stellen Menschen aus, die lieber ihre Arbeit zeigen als sich selbst.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <Link href="/auth/login">
              <button className="btn-primary w-full sm:w-auto">Jetzt entdecken</button>
            </Link>
            <Link href="/bewerben" className="btn-ghost text-center sm:text-left">
              Ich möchte ausstellen →
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden bg-ink/5 grid grid-cols-2 gap-px p-px">
          {[
            { title: 'Ohne Titel, 2024', type: 'Visuelle Kunst', bg: '#e8e4df' },
            { title: 'Rauschen', type: 'Sound', bg: '#1a1a18' },
            { title: 'Fragment IV', type: 'Fotografie', bg: '#d4cfc9' },
            { title: 'Schwelle', type: 'Video', bg: '#2a2a28' },
          ].map((tile, i) => (
            <div
              key={i}
              className="relative flex flex-col justify-end p-4"
              style={{ background: tile.bg, minHeight: '160px' }}
            >
              <div className="text-xs" style={{ color: tile.bg === '#1a1a18' || tile.bg === '#2a2a28' ? 'rgba(247,245,242,.4)' : 'var(--soft)' }}>
                <div className="font-serif text-sm mb-0.5" style={{ color: tile.bg === '#1a1a18' || tile.bg === '#2a2a28' ? 'rgba(247,245,242,.7)' : 'var(--ink)' }}>
                  {tile.title}
                </div>
                <div className="tracking-widest uppercase text-xs">{tile.type}</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="px-6 md:px-10 py-4 border-t border-line flex justify-between">
        <span className="text-xs text-soft">Freshfield — Eingetragener Verein</span>
        <span className="text-xs text-soft">Kunst zuerst.</span>
      </footer>
    </div>
  )
}
