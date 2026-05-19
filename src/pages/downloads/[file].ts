export const prerender = false

import type { APIRoute } from 'astro'

const ALLOWED = new Set([
  'full-toolkit.zip',
  'fm1-toolkit.zip',
  'fm2-toolkit.zip',
  'fm3-toolkit.zip',
  'fm4-toolkit.zip',
])

export const GET: APIRoute = async ({ params, locals }) => {
  const file = params.file

  if (!file || !ALLOWED.has(file)) {
    return new Response('Not found', { status: 404 })
  }

  // @ts-ignore — runtime env typed via wrangler binding
  const bucket = locals.runtime?.env?.PDFS

  if (!bucket) {
    return new Response('Storage unavailable', { status: 503 })
  }

  const object = await bucket.get(file)

  if (!object) {
    return new Response('File not found', { status: 404 })
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${file}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
