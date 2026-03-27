'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ADMIN_EMAIL = 'snaak@hotmail.de'

export default function AdminPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) { router.push('/feed'); return }
      const { data } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false })
      setApplications(data ?? [])
      setReady(true)
    }
    load()
  }, [])

  async function approve(app: any) {
    setLoading(app.id)
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: app.id, email: app.email })
    })
    if (res.ok) {
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'approved' } : a))
    }
    setLoading(null)
  }

  async function reject(app: any) {
    setLoading(app.id)
    const res = await fetch('/api/admin/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: app.id, email: app.email })
    })
    if (res.ok) {
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'rejected' } : a))
    }
    setLoading(null)
  }

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <p className="text-sm text-soft tracking-widest uppercase">Wird geladen…</p>
    </div>
  )

  const pending = applications.filter(a => a.status === 'pending')
  const rest = applications.filter(a => a.status !== 'pending')

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="px-10 py-5 border-b border-line flex justify-between items-center">
        <span className="logo-text text-ink">Freshfield Admin</span>
        <span className="text-xs text-soft">{pending.length} offen</span>
      </header>

      <div className="max-w-2xl mx-auto px-10 py-12 flex flex-col gap-6">
        {pending.length === 0 && <p className="text-sm text-soft">Keine offenen Bewerbungen.</p>}
        {[...pending, ...rest].map(app => (
          <div key={app.id} className="border border-line p-6 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">{app.email}</p>
                <p className="text-xs text-soft mt-0.5">{new Date(app.created_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <span className={`text-[10px] tracking-widest uppercase px-2 py-1 ${app.status === 'pending' ? 'bg-amber-100 text-amber-700' : app.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {app.status === 'pending' ? 'Offen' : app.status === 'approved' ? 'Angenommen' : 'Abgelehnt'}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-soft whitespace-pre-wrap">{app.message}</p>
            {app.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => approve(app)}
                  disabled={loading === app.id}
                  className="text-xs tracking-widest uppercase bg-ink text-bg px-4 py-2 disabled:opacity-30"
                >
                  {loading === app.id ? '…' : 'Annehmen'}
                </button>
                <button
                  onClick={() => reject(app)}
                  disabled={loading === app.id}
                  className="text-xs tracking-widest uppercase border border-line text-soft px-4 py-2 hover:border-ink hover:text-ink transition-all disabled:opacity-30"
                >
                  Ablehnen
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
