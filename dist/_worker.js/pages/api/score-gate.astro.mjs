globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../renderers.mjs';

const prerender = false;
async function POST({ request, locals }) {
  const env = locals.runtime?.env ?? locals;
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Bad request" }), { status: 400 });
  }
  const { name = "", email, businessName = "", url = "", location = "", niche = "", score = 0, profile = "", reportId = "" } = body;
  if (!email || !businessName) {
    return new Response(JSON.stringify({ error: "email and businessName required" }), { status: 400 });
  }
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1e3);
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS score_leads (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT NOT NULL,
        business_name TEXT,
        url TEXT,
        location TEXT,
        niche TEXT,
        score INTEGER,
        profile TEXT,
        report_id TEXT,
        created_at INTEGER NOT NULL
      )
    `).run();
    await env.DB.prepare(`
      INSERT INTO score_leads (id, name, email, business_name, url, location, niche, score, profile, report_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, name, email, businessName, url, location, niche, score, profile, reportId, now).run();
  } catch (e) {
    console.error("D1 insert failed:", e);
  }
  try {
    const reportLink = reportId ? `<p><a href="https://engageengine-dvs.robertlbutt.workers.dev/reports/${reportId}">View full DVS report →</a></p>` : "";
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.Resend}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "EngageEngine <notifications@send.marketingperformance.net>",
        to: ["robertlbutt@gmail.com"],
        subject: `🎯 AI Score Unlock — ${businessName} · ${score}/100 ${profile}`,
        html: `
          <p><strong>DVS Score Unlocked — New Lead</strong></p>
          <p>
            <strong>Name:</strong> ${name || "(not provided)"}<br>
            <strong>Email:</strong> ${email}<br>
            <strong>Business:</strong> ${businessName}<br>
            <strong>Website:</strong> ${url}<br>
            <strong>Market:</strong> ${location} — ${niche}<br>
            <strong>Score:</strong> ${score}/100 — ${profile}
          </p>
          ${reportLink}
        `
      })
    });
  } catch (e) {
    console.error("Resend failed:", e);
  }
  return new Response(JSON.stringify({ ok: true, id }), {
    headers: { "Content-Type": "application/json" }
  });
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
