export const prerender = false
import type { APIContext } from 'astro'

// Diagnostic submissions (2026-10-27). Replaces Formspree form mnjlkyjo, which accepted
// submissions after the Oct 25 rebuild but stopped emailing them. Every completion and
// plan application is saved to D1 first, then emailed to Robbie through Resend.

const NOTIFY_TO = 'robertlbutt@gmail.com'
const FROM = 'Marketing Performance <diagnostic@send.marketingperformance.net>'

const esc = (v: unknown) => String(v ?? '').slice(0, 4000)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export async function POST({ request, locals }: APIContext) {
  const env = (locals as any).runtime?.env ?? (locals as any)

  let body: Record<string, any>
  try { body = await request.json() }
  catch { return json({ error: 'Bad request' }, 400) }

  const kind = body.kind === 'application' ? 'application' : body.kind === 'completion' ? 'completion' : ''
  if (!kind) return json({ error: 'kind required' }, 400)

  // Honeypot filled in: a bot. Answer ok so it moves on, but keep nothing.
  if (body._gotcha) return json({ ok: true })

  const { kind: _k, _gotcha, ...fields } = body
  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  const primary = esc(fields.primary_fm || fields.preliminary_fm || '')

  let saved = false
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS diagnostic_submissions (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        primary_fm TEXT,
        secondary_fm TEXT,
        name TEXT,
        email TEXT,
        company TEXT,
        payload TEXT NOT NULL,
        user_agent TEXT,
        emailed INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      )
    `).run()
    await env.DB.prepare(`
      INSERT INTO diagnostic_submissions (id, kind, primary_fm, secondary_fm, name, email, company, payload, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, kind, String(fields.primary_fm || fields.preliminary_fm || ''), String(fields.secondary_fm || ''),
      String(fields.name || ''), String(fields.email || ''), String(fields.company || ''),
      JSON.stringify(fields).slice(0, 20000), (request.headers.get('user-agent') || '').slice(0, 300), now,
    ).run()
    saved = true
  } catch (e) {
    console.error('diagnostic D1 insert failed:', e)
  }

  const subject = kind === 'application'
    ? `Plan Application: ${String(fields.company || '(no company)')} (${String(fields.preliminary_fm || '')})`
    : `Diagnostic Completed: ${String(fields.primary_fm || '')}`
  const rows = Object.entries(fields)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#707070;vertical-align:top">${esc(k)}</td><td style="padding:4px 0">${esc(v)}</td></tr>`)
    .join('')

  let emailed = false
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.Resend}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [NOTIFY_TO],
        ...(kind === 'application' && fields.email ? { reply_to: String(fields.email) } : {}),
        subject,
        html: `<p><strong>${kind === 'application' ? 'New plan application' : 'Diagnostic completed'}</strong>${primary ? ` &middot; ${primary}` : ''}</p>
<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">${rows}</table>
<p style="color:#707070;font-size:12px">Saved to D1 marketingperformance-leads, table diagnostic_submissions, id ${id}${saved ? '' : ' (SAVE FAILED, this email is the only copy)'}.</p>`,
      }),
    })
    emailed = r.ok
    if (!r.ok) console.error('diagnostic Resend failed:', r.status, await r.text())
  } catch (e) {
    console.error('diagnostic Resend failed:', e)
  }

  if (saved && emailed) {
    try { await env.DB.prepare('UPDATE diagnostic_submissions SET emailed = 1 WHERE id = ?').bind(id).run() } catch {}
  }

  // The applicant only sees success if at least one copy exists somewhere.
  if (!saved && !emailed) return json({ error: 'Could not record submission' }, 500)
  return json({ ok: true, id, saved, emailed })
}
