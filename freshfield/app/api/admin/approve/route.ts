import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { applicationId, email } = await req.json()

  // Status auf approved setzen
  await supabase.from('applications').update({ status: 'approved' }).eq('id', applicationId)

  // Auth-User anlegen falls nicht vorhanden
  const { data: existing } = await supabase.auth.admin.listUsers()
  const userExists = existing.users.find(u => u.email === email)
  if (!userExists) {
    await supabase.auth.admin.createUser({ email, email_confirm: true })
  }

  // E-Mail an Bewerber
  await resend.emails.send({
    from: 'Freshfield <hallo@freshfield.de>',
    to: email,
    subject: 'Du wurdest angenommen.',
    html: `
      <p>Hallo,</p>
      <p>deine Bewerbung bei Freshfield wurde angenommen.</p>
      <p>Du kannst dich jetzt einloggen und dein Profil einrichten:</p>
      <p><a href="https://freshfield-app.vercel.app/auth/login">Jetzt einloggen →</a></p>
      <p>Freshfield</p>
    `
  })

  return NextResponse.json({ ok: true })
}
