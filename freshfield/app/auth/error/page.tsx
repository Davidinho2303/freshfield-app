import Link from 'next/link'

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error_description?: string }
}) {
  const msg = searchParams.error_description?.replace(/\+/g, ' ') ?? 'Unbekannter Fehler'
  const expired = msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center max-w-sm px-6">
        <h1 className="font-serif text-3xl font-normal mb-3">
          {expired ? 'Link abgelaufen.' : 'Fehler beim Login.'}
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: '#5a5855' }}>
          {expired
            ? 'Der Bestätigungslink ist nur 24 Stunden gültig. Bitte fordere einen neuen an.'
            : msg}
        </p>
        <Link href="/auth/login">
          <button className="btn-primary">Neuen Link anfordern</button>
        </Link>
      </div>
    </div>
  )
}
