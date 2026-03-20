# Deploy Guide — gbp-intelligence

## Prerequisites

```bash
npm install -g wrangler
wrangler login   # authenticate with Cloudflare account
```

## Step 1: Create D1 Database

```bash
wrangler d1 create gbp-intelligence-db
```

Copy the `database_id` from the output and paste it into `wrangler.toml`:
```toml
[[d1_databases]]
database_id = "paste-id-here"
```

## Step 2: Create KV Namespace

```bash
wrangler kv:namespace create CACHE
```

Copy the `id` from the output and paste it into `wrangler.toml`:
```toml
[[kv_namespaces]]
id = "paste-id-here"
```

## Step 3: Run Migrations + Seed

```bash
# Apply schema
wrangler d1 execute gbp-intelligence-db --file=migrations/001-init.sql

# Seed 46 clients
wrangler d1 execute gbp-intelligence-db --file=scripts/seed.sql

# Verify
wrangler d1 execute gbp-intelligence-db --command="SELECT count(*) FROM clients"
# Should return: 46
```

## Step 4: Set Secrets

```bash
# Required
wrangler secret put GOOGLE_PLACES_API_KEY
# → paste your Places API key from console.cloud.google.com (project: gbp-analyzer-488210)

wrangler secret put REPORT_SECRET
# → run: openssl rand -hex 32 and paste

wrangler secret put ADMIN_KEY
# → run: openssl rand -hex 32 and paste

wrangler secret put EMAIL_API_KEY
# → paste your Resend API key from resend.com
```

## Step 5: Deploy

```bash
wrangler deploy
```

Output will show: `https://gbp-intelligence.<your-account>.workers.dev`

## Step 6: Resolve Client Place IDs

For each client without a Place ID, call:

```bash
curl -X POST "https://gbp-intelligence.<account>.workers.dev/admin/clients/1/resolve-place-id" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY"
```

Or use the dashboard: `/admin/dashboard` → click client → "Resolve" link.

Bulk resolve script (run once):
```bash
for i in $(seq 1 46); do
  curl -s -X POST "https://<worker>/admin/clients/$i/resolve-place-id" \
    -H "X-Admin-Key: $ADMIN_KEY" | jq '.resolved, .place_id'
  sleep 0.5
done
```

## Step 7: Verify

```bash
# Health check
curl https://<worker>/api/health

# Test score lookup
curl "https://<worker>/api/gbp-score?q=Stormy+Plumbing+Lexington+SC"

# Admin dashboard (bookmark this)
open "https://<worker>/admin/dashboard"
# Enter ADMIN_KEY when prompted by browser

# Test report
open "https://<worker>/report/prospect/<place_id>?key=YOUR_REPORT_SECRET"
```

## Useful Commands

```bash
# Watch live logs
wrangler tail

# Test cron manually
wrangler dev --test-scheduled

# Local dev with real D1/KV (preview mode)
wrangler dev --remote

# Run a query on production D1
wrangler d1 execute gbp-intelligence-db --command="SELECT name, score, score_label FROM clients c LEFT JOIN audits a ON a.client_id = c.id ORDER BY a.audit_date DESC LIMIT 10"
```

## Key URLs (bookmark these)

| URL | Purpose |
|-----|---------|
| `/admin/dashboard` | Client scores overview |
| `/admin/leads?format=html` | Lead captures |
| `/gbp-score` | Public lead magnet |
| `/report/prospect/{place_id}?key=...` | Prospect report |
| `/report/client/{audit_id}?key=...` | Client report |
| `/report/compare/{id1}/{id2}?key=...` | Comparison report |

## Troubleshooting

**Places API 403**: Check `GOOGLE_PLACES_API_KEY` is set and Places API is enabled in `gbp-analyzer-488210` project.

**D1 errors**: Make sure `database_id` in `wrangler.toml` matches what `wrangler d1 list` shows.

**Email not sending**: Check `EMAIL_API_KEY` secret and verify your sender domain in Resend dashboard.

**Score always 0**: Check KV namespace ID is correct and `CACHE` binding is set in `wrangler.toml`.
