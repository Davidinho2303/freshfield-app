import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileSetupClient from '@/components/ProfileSetupClient'

export default async function ProfileSetupPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('slug')
    .eq('user_id', user.id)
    .single()

  if (profile) redirect(`/profil/${profile.slug}`)

  return <ProfileSetupClient userId={user.id} />
}
