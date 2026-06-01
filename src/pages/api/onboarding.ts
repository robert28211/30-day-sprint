export const prerender = false

import type { APIRoute } from 'astro'

const TEAM_EMAILS = ['robertlbutt@gmail.com', 'aaron@marketingperformance.net']

interface OnboardingData {
  // Step 1
  clientName?: string
  clientEmail?: string
  businessName?: string
  phone?: string
  address?: string
  // Step 2 — file uploaded to R2
  w9File?: string        // R2 key
  // Step 3
  gbpCheck?: string
  fbCheck?: string
  gaCheck?: string
  gscCheck?: string
  // Step 4
  registrarUsername?: string
  registrarPassword?: string
  cmsUrl?: string
  cmsUsername?: string
  cmsPassword?: string
  // Step 5 — files uploaded to R2
  logoFile?: string      // R2 key
  photosFile?: string    // R2 key
  igUsername?: string
  igPassword?: string
  pinterestUsername?: string
  pinterestPassword?: string
  xUsername?: string
  xPassword?: string
  tiktokUsername?: string
  tiktokPassword?: string
  // Step 6 — file uploaded to R2
  customerListFile?: string  // R2 key
  appUser1Name?: string
  appUser1Email?: string
  appUser1Phone?: string
  appUser2Name?: string
  appUser2Email?: string
  appUser2Phone?: string
  appUser3Name?: string
  appUser3Email?: string
  appUser3Phone?: string
  notificationRecipient?: string
  angiUsername?: string
  angiPassword?: string
  yelpUsername?: string
  yelpPassword?: string
  aiWidget?: string
  competitors?: string
  callTime?: string
}

// File fields that get uploaded to R2
const FILE_FIELDS = ['w9File', 'logoFile', 'photosFile', 'customerListFile'] as const
type FileField = typeof FILE_FIELDS[number]

// @ts-ignore — R2Bucket type from @cloudflare/workers-types
type R2Bucket = any

async function uploadToR2(
  r2: R2Bucket,
  id: string,
  fieldName: string,
  file: File
): Promise<string> {
  const key = `onboarding/${id}/${fieldName}/${file.name}`
  const buffer = await file.arrayBuffer()
  await r2.put(key, buffer, {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
    customMetadata: { originalName: file.name, uploadedAt: new Date().toISOString() },
  })
  return key
}

function buildTeamEmail(data: OnboardingData, fileKeys: Record<string, string>): string {
  const platforms = [
    data.gbpCheck === 'true' && 'Google Business Profile',
    data.fbCheck === 'true' && 'Facebook',
    data.gaCheck === 'true' && 'Google Analytics',
    data.gscCheck === 'true' && 'Search Console',
  ].filter(Boolean).join(', ') || 'None checked'

  const appUsers = [1, 2, 3]
    .map(n => {
      const name = data[`appUser${n}Name` as keyof OnboardingData] as string
      const email = data[`appUser${n}Email` as keyof OnboardingData] as string
      const phone = data[`appUser${n}Phone` as keyof OnboardingData] as string
      if (!name && !email) return null
      return `  ${n}. ${name || '—'} | ${email || '—'} | ${phone || '—'}`
    })
    .filter(Boolean)
    .join('\n') || '  None provided'

  const fileLines = FILE_FIELDS.map(f => {
    const labels: Record<string, string> = { w9File: 'W-9', logoFile: 'Logo', photosFile: 'Photos/Video', customerListFile: 'Customer List' }
    const key = fileKeys[f]
    return `  ${labels[f]}: ${key ? `[R2] ${key}` : '—'}`
  }).join('\n')

  return `
New onboarding submission from ${data.businessName || 'Unknown Business'}

━━━ CONTACT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:     ${data.clientName || '—'}
Email:    ${data.clientEmail || '—'}
Phone:    ${data.phone || '—'}
Address:  ${data.address || '—'}

━━━ UPLOADED FILES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fileLines}
(Access via Cloudflare R2 → marketingperformance-pdfs)

━━━ PLATFORM ACCESS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Platforms confirmed: ${platforms}

━━━ WEBSITE & DOMAIN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Registrar username: ${data.registrarUsername || '—'}
Registrar password: ${data.registrarPassword || '—'}
CMS URL:            ${data.cmsUrl || '—'}
CMS username:       ${data.cmsUsername || '—'}
CMS password:       ${data.cmsPassword || '—'}

⚠️  Remind client to update passwords once setup is complete.

━━━ DIGITAL ASSETS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Social credentials:
  Instagram:  ${data.igUsername || '—'} / ${data.igPassword || '—'}
  Pinterest:  ${data.pinterestUsername || '—'} / ${data.pinterestPassword || '—'}
  X:          ${data.xUsername || '—'} / ${data.xPassword || '—'}
  TikTok:     ${data.tiktokUsername || '—'} / ${data.tiktokPassword || '—'}

━━━ BUSINESS APP SETUP ━━━━━━━━━━━━━━━━━━━━━━━━━━━
App users:
${appUsers}

Notification recipient: ${data.notificationRecipient || '—'}

Review sites:
  Angi/HA: ${data.angiUsername || '—'} / ${data.angiPassword || '—'}
  Yelp:    ${data.yelpUsername || '—'} / ${data.yelpPassword || '—'}

AI widget:   ${data.aiWidget || '—'}
Competitors: ${data.competitors || '—'}
Call time:   ${data.callTime || '—'}
`.trim()
}

export const POST: APIRoute = async ({ request, locals }) => {
  // @ts-ignore — runtime env typed via wrangler binding
  const env = locals.runtime?.env

  // Parse multipart FormData
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
  }

  // Extract text fields into data object
  const data: OnboardingData = {}
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string' && !FILE_FIELDS.includes(key as FileField)) {
      ;(data as Record<string, string>)[key] = value
    }
  }

  // Required field validation
  if (!data.clientName?.trim()) return Response.json({ ok: false, error: 'Client name is required' })
  if (!data.clientEmail?.trim()) return Response.json({ ok: false, error: 'Client email is required' })
  if (!data.businessName?.trim()) return Response.json({ ok: false, error: 'Business name is required' })
  if (!data.phone?.trim()) return Response.json({ ok: false, error: 'Phone number is required' })
  if (!data.address?.trim()) return Response.json({ ok: false, error: 'Business address is required' })

  // W-9 file is optional
  const w9FileEntry = form.get('w9File')
  const w9File = w9FileEntry instanceof File && w9FileEntry.size > 0 ? w9FileEntry : null

  const id = crypto.randomUUID()
  const submittedAt = new Date().toISOString()

  // Upload files to R2
  const r2: R2Bucket = env?.PDFS
  const fileKeys: Record<string, string> = {}

  if (r2) {
    for (const fieldName of FILE_FIELDS) {
      const entry = form.get(fieldName)
      if (entry instanceof File && entry.size > 0) {
        try {
          const key = await uploadToR2(r2, id, fieldName, entry)
          fileKeys[fieldName] = key
          ;(data as Record<string, string>)[fieldName] = key
        } catch (err) {
          console.error(`R2 upload failed for ${fieldName}:`, err)
          if (fieldName === 'w9File') {
            return Response.json({
              ok: false,
              error: 'Failed to upload W-9 — please try again or email robert@marketingperformance.net',
            })
          }
        }
      }
    }
  }

  // D1 insert
  const db = env?.DB
  if (db) {
    try {
      await db
        .prepare(
          'INSERT INTO onboarding_submissions (id, submitted_at, business_name, client_name, client_email, data_json) VALUES (?, ?, ?, ?, ?, ?)'
        )
        .bind(id, submittedAt, data.businessName, data.clientName, data.clientEmail, JSON.stringify(data))
        .run()
    } catch (err) {
      console.error('D1 insert failed:', err)
      return Response.json({
        ok: false,
        error: 'Submission failed — please try again or email robert@marketingperformance.net',
      })
    }
  }

  // Resend — team notification + client confirmation
  const resendKey = env?.RESEND_KEY ?? env?.Resend
  console.log('RESEND_KEY present:', !!resendKey)

  if (resendKey) {
    const emailBody = buildTeamEmail(data, fileKeys)

    // Team email
    try {
      const teamRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Marketing Performance Group <onboarding@send.marketingperformance.net>',
          to: TEAM_EMAILS,
          subject: `New Onboarding: ${data.businessName}`,
          text: emailBody,
        }),
      })
      if (!teamRes.ok) {
        const body = await teamRes.text()
        console.error('Resend team email error:', teamRes.status, body)
      }
    } catch (err) {
      console.error('Resend team email failed:', err)
    }

    // Client confirmation email — TODO: enable once marketingperformance.net is verified in Resend
  } else {
    console.error('RESEND_KEY not set — emails skipped')
  }

  return Response.json({ ok: true })
}
