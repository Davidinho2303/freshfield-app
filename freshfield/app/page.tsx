'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LandingPage from '@/components/LandingPage'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) router.push('/feed')
    })
  }, [])
  return <LandingPage />
}
