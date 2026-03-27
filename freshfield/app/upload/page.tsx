'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import UploadClient from '@/components/UploadClient'

export default function UploadPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
      if (!profile) { router.push('/profil/setup'); return }
      setProfile(profile)
      setReady(true)
    }
    load()
  }, [])

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <p className="text-sm text-soft tracking-widest uppercase">Wird geladen…</p>
    </div>
  )

  return <UploadClient profile={profile} userId={userId} />
}
