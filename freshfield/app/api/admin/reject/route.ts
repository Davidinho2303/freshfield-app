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

  await supabase.from('applications').update({ status: 'rejected' }).eq('id', applicationId)

  await resend.emails.send({
    from: 'Freshfield <hallo@freshfield.de>',
    to: email,
    subject: 'Deine Bewerbung bei Freshfield',
    html: `
      <p>Hallo,</p>
      <p>wir haben deine Bewerbung sorgfältig gelesen. Zum jetzigen Zeitpunkt können wir dich leider nicht aufnehmen.</p>
      <p>Du kannst dich gerne zu einem späteren Zeitpunkt erneut bewerben.</p>
      <p>Freshfield</p>
    `
  })

  return NextResponse.json({ ok: true })
}
