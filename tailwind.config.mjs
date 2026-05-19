/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        bg: '#0D1828',
        surface: '#1B2A4A',
        border: '#253B66',
        muted: '#5C7BAA',
        subtle: '#8BA8C8',
        body: '#C5D3E3',
        heading: '#F4F1EA',
        accent: '#C8A84B',
        steel: '#2E5D8E',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.2em',
      },
    },
  },
  plugins: [],
}
