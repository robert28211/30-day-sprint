import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://marketingperformance.net',
  output: 'static',
  adapter: cloudflare(),
  integrations: [sitemap()],
})
