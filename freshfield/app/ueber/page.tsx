'use client'
import Link from 'next/link'
import { HalmIcon } from '@/components/ui/HalmIcon'

export default function UeberPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="px-6 md:px-10 py-5 flex justify-between items-center border-b border-line">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <HalmIcon variant="light" />
          <span className="logo-text text-ink">Freshfield</span>
        </Link>
        <Link href="/" className="text-xs text-soft tracking-widest uppercase hover:text-ink transition-colors">
          ← Zurück
        </Link>
      </header>

      <main className="flex-1 max-w-lg mx-auto px-8 md:px-10 py-24 flex flex-col gap-20">

        <div className="flex flex-col gap-6">
          <p className="text-xs tracking-widest uppercase text-soft">Was ist das hier?</p>
          <h1 className="font-serif text-4xl font-normal leading-snug">
            Freshfield ist kein Feed.
          </h1>
          <div className="flex flex-col gap-4 text-sm text-soft leading-relaxed">
            <p>Es gibt keinen Algorithmus, der entscheidet was du siehst. Keine Empfehlungen, die dich in einer Schleife halten. Keinen Druck, täglich wiederzukommen.</p>
            <p>Freshfield ist ein Raum. Kuratiert, ruhig, ohne Lärm.</p>
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-line pt-12">
          <p className="text-xs tracking-widest uppercase text-soft">Für Besucher</p>
          <div className="flex flex-col gap-4 text-sm text-soft leading-relaxed">
            <p>Du kannst einfach schauen. Für den Feed brauchst du einen kostenlosen Account — nur eine E-Mail-Adresse, kein Name, kein Profil.</p>
            <p>Wenn dich ein Aussteller interessiert, kannst du seinen Newsletter abonnieren. Das war's.</p>
          </div>
          <Link
            href="/auth/login"
            className="self-start text-xs tracking-widest uppercase text-ink border-b border-ink pb-0.5 hover:text-soft hover:border-soft transition-colors"
          >
            Jetzt entdecken →
          </Link>
        </div>

        <div className="flex flex-col gap-6 border-t border-line pt-12">
          <p className="text-xs tracking-widest uppercase text-soft">Für Aussteller</p>
          <div className="flex flex-col gap-4 text-sm text-soft leading-relaxed">
            <p>Freshfield ist kein Portfolio-Baukasten und keine Social-Media-Plattform. Wer hier ausstellt, hat sich beworben. Nicht weil wir exklusiv sein wollen, sondern weil ein kuratierter Raum nur funktioniert wenn alle, die darin ausstellen, das auch wirklich wollen.</p>
            <p>Es gibt keine Reichweiten-Statistiken, keine viralen Momente. Nur Werke. Und Menschen die sie betrachten.</p>
          </div>
          <Link
            href="/bewerben"
            className="self-start text-xs tracking-widest uppercase text-ink border-b border-ink pb-0.5 hover:text-soft hover:border-soft transition-colors"
          >
            Aussteller werden →
          </Link>
        </div>

        <div className="flex flex-col gap-4 border-t border-line pt-12">
          <p className="font-serif text-2xl text-ink">Kunst zuerst.</p>
          <p className="text-sm text-soft leading-relaxed">
            Freshfield ist ein eingetragener Verein — getragen von den Menschen die hier ausstellen und denen die hier schauen.
          </p>
        </div>

      </main>

      <footer className="px-6 md:px-10 py-4 border-t border-line flex justify-between">
        <span className="text-xs text-soft">Freshfield — Eingetragener Verein</span>
        <span className="text-xs text-soft">Kunst zuerst.</span>
      </footer>
    </div>
  )
}
