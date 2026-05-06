import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { applicationId, email, message } = await req.json()

    // Bewerbung speichern oder updaten (server-seitig, umgeht RLS)
    if (applicationId) {
      await supabase
        .from('applications')
        .update({ status: 'approved' })
        .eq('id', applicationId)
    } else if (message) {
      await supabase
        .from('applications')
        .insert({ email: email.trim(), message: message.trim(), status: 'approved' })
    }

    // User anlegen falls nicht vorhanden
    const { data: existing } = await supabase.auth.admin.listUsers()
    const userExists = existing.users.find((u: any) => u.email === email)

    if (!userExists) {
      await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { role: 'aussteller' }
      })
    }

    // Mail senden
    const { error: mailError } = await resend.emails.send({
      from: 'Freshfield <hallo@freshfield.cloud>',
      to: email,
      subject: 'Du wurdest angenommen.',
      html: `
        <p>Hallo,</p>
        <p>deine Bewerbung bei Freshfield wurde angenommen.</p>
        <p>Logge dich ein um dein Profil einzurichten:</p>
        <p><a href="https://freshfield.cloud/auth/login">Jetzt einloggen →</a></p>
        <p>Gib dort deine E-Mail-Adresse ein – du bekommst einen Login-Link zugeschickt.</p>
        <p>Freshfield</p>
      `
    })

    if (mailError) {
      console.error('Resend error:', mailError)
      return NextResponse.json({ ok: false, error: mailError }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('approve route error:', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
