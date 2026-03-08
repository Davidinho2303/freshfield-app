import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UploadClient from '@/components/UploadClient'

export default async function UploadPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/profil/setup')

  return <UploadClient profile={profile} userId={user.id} />
}
