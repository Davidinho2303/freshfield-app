'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ProfileSetupClient from '@/components/ProfileSetupClient'

export default function ProfileSetupPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      // Bereits ein Profil? → Feed
      const { data: profile } = await supabase
        .from('profiles').select('slug').eq('user_id', user.id).single()
      if (profile) { router.push('/feed'); return }

      setUserId(user.id)
    }
    load()
  }, [])

  if (!userId) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <p className="text-sm text-soft tracking-widest uppercase">Wird geladen…</p>
    </div>
  )

  return <ProfileSetupClient userId={userId} />
}
