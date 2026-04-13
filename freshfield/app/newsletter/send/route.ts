import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function renderBlocks(blocks: any[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case 'h1':
        return `<h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;font-size:2rem;color:#1a1a18;margin:0 0 1rem">${block.content ?? ''}</h1>`
      case 'h2':
        return `<h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;font-size:1.4rem;color:#1a1a18;margin:0 0 0.75rem">${block.content ?? ''}</h2>`
      case 'text':
        return `<p style="font-size:.9rem;line-height:1.7;color:#3a3835;margin:0 0 1rem">${(block.content ?? '').replace(/\n/g, '<br>')}</p>`
      case 'quote':
        return `<blockquote style="border-left:2px solid #2d6a2d;padding-left:1rem;margin:0 0 1rem;font-style:italic;color:#5a5855;font-size:.9rem">${block.content ?? ''}</blockquote>`
      case 'divider':
        return `<hr style="border:none;border-top:1px solid #e8e4de;margin:1.5rem 0">`
      case 'list':
        return `<ul style="padding-left:0;list-style:none;margin:0 0 1rem">${(block.items ?? []).map((item: string) => `<li style="font-size:.9rem;color:#3a3835;padding:.25rem 0">— ${item}</li>`).join('')}</ul>`
      case 'button':
        return `<div style="margin:1rem 0"><a href="${block.url ?? '#'}" style="display:inline-block;border:1px solid #2d6a2d;color:#2d6a2d;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;padding:.5rem 1.25rem;text-decoration:none">${block.label ?? 'Link'}</a></div>`
      case 'image':
        return `<div style="margin:1rem 0">${block.src ? `<img src="${block.src}" alt="${block.caption ?? ''}" style="width:100%;display:block">` : ''} ${block.caption ? `<p style="font-size:.75rem;color:#9a9690;margin:.5rem 0 0">${block.caption}</p>` : ''}</div>`
      case 'video':
        return `<div style="margin:1rem 0"><a href="${block.video_url ?? '#'}" style="font-size:.85rem;color:#2d6a2d">${block.video_url ?? ''}</a></div>`
      default:
        return ''
    }
  }).join('\n')
}

export async function POST(req: NextRequest) {
  const { newsletter_id } = await req.json()
  if (!newsletter_id) return NextResponse.json({ error: 'newsletter_id fehlt' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const resend = new Resend(process.env.RESEND_API_KEY!)

  // Newsletter laden
  const { data: newsletter, error: nlError } = await supabase
    .from('newsletters')
    .select('*, profiles(name, slug)')
    .eq('id', newsletter_id)
    .single()

  if (nlError || !newsletter) return NextResponse.json({ error: 'Newsletter nicht gefunden' }, { status: 404 })
  if (newsletter.status === 'sent') return NextResponse.json({ error: 'Bereits versendet' }, { status: 400 })

  // Abonnenten laden
  const { data: subscribers } = await supabase
    .from('newsletter_subscriptions')
    .select('email')
    .eq('profile_id', newsletter.profile_id)
    .eq('confirmed', true)

  if (!subscribers?.length) return NextResponse.json({ error: 'Keine Abonnenten' }, { status: 400 })

  const profileName = newsletter.profiles?.name ?? 'Freshfield'
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f5f2;font-family:Georgia,serif">
  <div style="max-width:600px;margin:0 auto;padding:2rem 1rem">
    <div style="border-bottom:1px solid #e8e4de;padding-bottom:1.5rem;margin-bottom:2rem">
      <p style="font-size:.65rem;letter-spacing:.15em;text-transform:uppercase;color:#9a9690;margin:0">Freshfield · Aus dem Feld</p>
      <p style="font-size:.75rem;color:#9a9690;margin:.5rem 0 0">${profileName}</p>
    </div>
    ${renderBlocks(newsletter.blocks ?? [])}
    <div style="border-top:1px solid #e8e4de;padding-top:1.5rem;margin-top:2rem">
      <p style="font-size:.7rem;color:#9a9690;margin:0">Du erhältst diese E-Mail weil du den Newsletter von ${profileName} auf Freshfield abonniert hast.</p>
    </div>
  </div>
</body>
</html>`

  // An alle Abonnenten senden
  const results = await Promise.allSettled(
    subscribers.map(sub =>
      resend.emails.send({
        from: `${profileName} via Freshfield <newsletter@freshfield.de>`,
        to: sub.email,
        subject: newsletter.subject || 'Aus dem Feld',
        html,
      })
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  // Status auf 'sent' setzen
  await supabase
    .from('newsletters')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', newsletter_id)

  return NextResponse.json({ sent, failed })
}
