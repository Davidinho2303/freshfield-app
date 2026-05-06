import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { applicationId, email } = await req.json()

  await supabase.from('applications').update({ status: 'approved' }).eq('id', applicationId)

  const { data: existing } = await supabase.auth.admin.listUsers()
  const userExists = existing.users.find((u: any) => u.email === email)

  if (!userExists) {
    await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { role: 'aussteller' }
    })
  }

  // Magic Link generieren
  const { data: linkData } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: 'https://freshfield.cloud/auth/callback?next=/profil/setup'
    }
  })

  const magicLink = linkData?.properties?.action_link ?? 'https://freshfield.cloud/auth/login'

  await resend.emails.send({
    from: 'Freshfield <hallo@freshfield.cloud>',
    to: email,
    subject: 'Du wurdest angenommen.',
    html: `
      <p>Hallo,</p>
      <p>deine Bewerbung bei Freshfield wurde angenommen.</p>
      <p>Klick auf den Link unten um dich einzuloggen und dein Profil einzurichten:</p>
      <p><a href="${magicLink}">Jetzt einloggen & Profil einrichten →</a></p>
      <p>Freshfield</p>
    `
  })

  return NextResponse.json({ ok: true })
}
