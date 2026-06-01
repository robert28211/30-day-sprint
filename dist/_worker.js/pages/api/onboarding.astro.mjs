globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../renderers.mjs';

const prerender = false;
const TEAM_EMAILS = ["robertlbutt@gmail.com", "aaron@marketingperformance.net"];
const FILE_FIELDS = ["w9File", "logoFile", "photosFile", "customerListFile"];
async function uploadToR2(r2, id, fieldName, file) {
  const key = `onboarding/${id}/${fieldName}/${file.name}`;
  const buffer = await file.arrayBuffer();
  await r2.put(key, buffer, {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
    customMetadata: { originalName: file.name, uploadedAt: (/* @__PURE__ */ new Date()).toISOString() }
  });
  return key;
}
function buildTeamEmail(data, fileKeys) {
  const platforms = [
    data.gbpCheck === "true" && "Google Business Profile",
    data.fbCheck === "true" && "Facebook",
    data.gaCheck === "true" && "Google Analytics",
    data.gscCheck === "true" && "Search Console"
  ].filter(Boolean).join(", ") || "None checked";
  const appUsers = [1, 2, 3].map((n) => {
    const name = data[`appUser${n}Name`];
    const email = data[`appUser${n}Email`];
    const phone = data[`appUser${n}Phone`];
    if (!name && !email) return null;
    return `  ${n}. ${name || "—"} | ${email || "—"} | ${phone || "—"}`;
  }).filter(Boolean).join("\n") || "  None provided";
  const fileLines = FILE_FIELDS.map((f) => {
    const labels = { w9File: "W-9", logoFile: "Logo", photosFile: "Photos/Video", customerListFile: "Customer List" };
    const key = fileKeys[f];
    return `  ${labels[f]}: ${key ? `[R2] ${key}` : "—"}`;
  }).join("\n");
  return `
New onboarding submission from ${data.businessName || "Unknown Business"}

━━━ CONTACT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:     ${data.clientName || "—"}
Email:    ${data.clientEmail || "—"}
Phone:    ${data.phone || "—"}
Address:  ${data.address || "—"}

━━━ UPLOADED FILES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fileLines}
(Access via Cloudflare R2 → marketingperformance-pdfs)

━━━ PLATFORM ACCESS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Platforms confirmed: ${platforms}

━━━ WEBSITE & DOMAIN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Registrar username: ${data.registrarUsername || "—"}
Registrar password: ${data.registrarPassword || "—"}
CMS URL:            ${data.cmsUrl || "—"}
CMS username:       ${data.cmsUsername || "—"}
CMS password:       ${data.cmsPassword || "—"}

⚠️  Remind client to update passwords once setup is complete.

━━━ DIGITAL ASSETS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Social credentials:
  Instagram:  ${data.igUsername || "—"} / ${data.igPassword || "—"}
  Pinterest:  ${data.pinterestUsername || "—"} / ${data.pinterestPassword || "—"}
  X:          ${data.xUsername || "—"} / ${data.xPassword || "—"}
  TikTok:     ${data.tiktokUsername || "—"} / ${data.tiktokPassword || "—"}

━━━ BUSINESS APP SETUP ━━━━━━━━━━━━━━━━━━━━━━━━━━━
App users:
${appUsers}

Notification recipient: ${data.notificationRecipient || "—"}

Review sites:
  Angi/HA: ${data.angiUsername || "—"} / ${data.angiPassword || "—"}
  Yelp:    ${data.yelpUsername || "—"} / ${data.yelpPassword || "—"}

AI widget:   ${data.aiWidget || "—"}
Competitors: ${data.competitors || "—"}
Call time:   ${data.callTime || "—"}
`.trim();
}
const POST = async ({ request, locals }) => {
  const env = locals.runtime?.env;
  let form;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }
  const data = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string" && !FILE_FIELDS.includes(key)) {
      data[key] = value;
    }
  }
  if (!data.clientName?.trim()) return Response.json({ ok: false, error: "Client name is required" });
  if (!data.clientEmail?.trim()) return Response.json({ ok: false, error: "Client email is required" });
  if (!data.businessName?.trim()) return Response.json({ ok: false, error: "Business name is required" });
  if (!data.phone?.trim()) return Response.json({ ok: false, error: "Phone number is required" });
  if (!data.address?.trim()) return Response.json({ ok: false, error: "Business address is required" });
  const w9FileEntry = form.get("w9File");
  w9FileEntry instanceof File && w9FileEntry.size > 0 ? w9FileEntry : null;
  const id = crypto.randomUUID();
  const submittedAt = (/* @__PURE__ */ new Date()).toISOString();
  const r2 = env?.PDFS;
  const fileKeys = {};
  if (r2) {
    for (const fieldName of FILE_FIELDS) {
      const entry = form.get(fieldName);
      if (entry instanceof File && entry.size > 0) {
        try {
          const key = await uploadToR2(r2, id, fieldName, entry);
          fileKeys[fieldName] = key;
          data[fieldName] = key;
        } catch (err) {
          console.error(`R2 upload failed for ${fieldName}:`, err);
          if (fieldName === "w9File") {
            return Response.json({
              ok: false,
              error: "Failed to upload W-9 — please try again or email robert@marketingperformance.net"
            });
          }
        }
      }
    }
  }
  const db = env?.DB;
  if (db) {
    try {
      await db.prepare(
        "INSERT INTO onboarding_submissions (id, submitted_at, business_name, client_name, client_email, data_json) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(id, submittedAt, data.businessName, data.clientName, data.clientEmail, JSON.stringify(data)).run();
    } catch (err) {
      console.error("D1 insert failed:", err);
      return Response.json({
        ok: false,
        error: "Submission failed — please try again or email robert@marketingperformance.net"
      });
    }
  }
  const resendKey = env?.RESEND_KEY ?? env?.Resend;
  console.log("RESEND_KEY present:", !!resendKey);
  if (resendKey) {
    const emailBody = buildTeamEmail(data, fileKeys);
    try {
      const teamRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "Marketing Performance Group <onboarding@send.marketingperformance.net>",
          to: TEAM_EMAILS,
          subject: `New Onboarding: ${data.businessName}`,
          text: emailBody
        })
      });
      if (!teamRes.ok) {
        const body = await teamRes.text();
        console.error("Resend team email error:", teamRes.status, body);
      }
    } catch (err) {
      console.error("Resend team email failed:", err);
    }
  } else {
    console.error("RESEND_KEY not set — emails skipped");
  }
  return Response.json({ ok: true });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
