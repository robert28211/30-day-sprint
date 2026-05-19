export const prerender = false

import type { APIRoute } from 'astro'

const MIME: Record<string, string> = {
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  gif:  'image/gif',
  webp: 'image/webp',
}

export const GET: APIRoute = async ({ params, locals }) => {
  const file = params.file
  if (!file) return new Response('Not found', { status: 404 })

  // Only allow safe filenames — alphanumeric, dash, underscore, dot
  if (!/^[\w\-]+\.(png|jpg|jpeg|gif|webp)$/i.test(file)) {
    return new Response('Invalid filename', { status: 400 })
  }

  // @ts-ignore — runtime env typed via wrangler binding
  const bucket = locals.runtime?.env?.PDFS
  if (!bucket) return new Response('Storage unavailable', { status: 503 })

  const object = await bucket.get(file)
  if (!object) return new Response('Not found', { status: 404 })

  const ext = file.split('.').pop()!.toLowerCase()
  const contentType = MIME[ext] ?? 'application/octet-stream'

  return new Response(object.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
