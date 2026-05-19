export const prerender = false
import type { APIContext } from 'astro'

function classifyTrade(raw: string): string {
  const r = raw.toLowerCase()
  if (/hvac|heat|cool|air.?cond|furnace|boiler|ac repair/.test(r)) return 'HVAC'
  if (/roof/.test(r)) return 'Roofing'
  if (/plumb|drain|sewer|pipe/.test(r)) return 'Plumbing'
  if (/electr/.test(r)) return 'Electrical'
  if (/landscap|lawn|garden|mow|tree|sod/.test(r)) return 'Landscaping'
  if (/pest|termite|bug|extermina/.test(r)) return 'Pest Control'
  if (/garage/.test(r)) return 'Garage Doors'
  if (/window|door/.test(r)) return 'Windows & Doors'
  if (/paint/.test(r)) return 'Painting'
  if (/floor/.test(r)) return 'Flooring'
  if (/gutter/.test(r)) return 'Gutters'
  if (/fence/.test(r)) return 'Fencing'
  if (/concrete|driveway|patio/.test(r)) return 'Concrete'
  if (/pool/.test(r)) return 'Pool Service'
  if (/clean/.test(r)) return 'Cleaning'
  if (/general|contractor|remodel|renovati/.test(r)) return 'General Contracting'
  // Unknown trade: title-case whatever they typed
  return raw.trim().replace(/\b\w/g, c => c.toUpperCase())
}

function vary(base: number, pct = 0.15): number {
  return Math.round(base * (1 + (Math.random() * 2 - 1) * pct))
}

function calcNumbers(city: string, trade: string) {
  let hash = 0
  for (const c of (city + trade).toLowerCase()) {
    hash = Math.imul(31, hash) + c.charCodeAt(0) | 0
  }
  const abs = Math.abs(hash)
  // Hash anchors the market-size range; random variance makes every pull unique
  const baseTotal     = 180 + (abs % 120)
  const baseMultiSite = Math.round(baseTotal * (0.34 + (abs >> 4 & 0xf) / 150))
  const total     = vary(baseTotal)
  const multiSite = vary(baseMultiSite)
  const compExp   = vary(Math.round(baseMultiSite * (0.34 + (abs >> 8 & 0xf) / 160)))
  return { total, multiSite, uncaptured: multiSite, competitorExposed: compExp }
}

export async function POST({ request, locals }: APIContext) {
  const env = (locals as any).runtime?.env ?? (locals as any)

  let body: Record<string, string>
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 })
  }

  const { name = '', email = '', phone = '', city_state = '', website = '', failure_mode = '',
          total_buyers: preTotal, multi_site: preMulti, competitor_exposed: preComp } = body
  const tradeRaw = (body.trade || '').trim()
  const trade    = classifyTrade(tradeRaw)

  if (!email || !city_state || !tradeRaw) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
  }

  const nums = (preTotal !== undefined)
    ? { total: Number(preTotal), multiSite: Number(preMulti ?? preTotal), uncaptured: Number(preMulti ?? preTotal), competitorExposed: Number(preComp ?? 0) }
    : calcNumbers(city_state, trade)
  const id   = crypto.randomUUID()
  const now  = Math.floor(Date.now() / 1000)

  try {
    await env.DB.prepare(`
      INSERT INTO snapshot_leads
        (id, name, email, city_state, trade, website, failure_mode,
         total_buyers, multi_site, uncaptured, competitor_exposed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, name, email, city_state, trade, website, failure_mode,
            nums.total, nums.multiSite, nums.uncaptured, nums.competitorExposed, now).run()
  } catch (e) {
    console.error('D1 insert failed:', e)
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.Resend}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'EngageEngine <notifications@marketingperformance.net>',
        to: ['robertlbutt@gmail.com'],
        subject: `🔥 Waitlist signup — ${city_state} · ${trade}`,
        html: `
          <p><strong>New Market Snapshot Request</strong></p>
          <p>
            <strong>Name:</strong> ${name}<br>
            <strong>Email:</strong> ${email}<br>
            <strong>Phone:</strong> ${phone || '(not provided)'}<br>
            <strong>Market:</strong> ${city_state} — ${trade}<br>
            <strong>Website:</strong> ${website || '(not provided)'}<br>
            <strong>Biggest problem:</strong> ${failure_mode || '(not selected)'}
          </p>
          <p>
            <strong>Numbers generated:</strong><br>
            Total: ${nums.total} &nbsp;|&nbsp;
            Multi-site: ${nums.multiSite} &nbsp;|&nbsp;
            Competitor-exposed: ${nums.competitorExposed}
          </p>
          <p><a href="https://marketingperformance.net/snapshot/${id}">View their snapshot →</a></p>
        `,
      }),
    })
  } catch (e) {
    console.error('Resend failed:', e)
  }

  return new Response(JSON.stringify({ id, ...nums }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
