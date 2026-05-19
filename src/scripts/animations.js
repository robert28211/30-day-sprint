import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ─── Scroll-reveal: any element with [data-animate] ───────────────────────────
gsap.utils.toArray('[data-animate]').forEach((el) => {
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    opacity: 0,
    y: 50,
    duration: 0.9,
    delay: parseFloat(el.dataset.delay) || 0,
    ease: 'power3.out',
  })
})

// ─── Hero: word-by-word stagger on page load ──────────────────────────────────
const heroWords = document.querySelectorAll('.hero-word')
if (heroWords.length) {
  gsap.from(heroWords, {
    opacity: 0,
    y: 40,
    duration: 0.7,
    stagger: 0.05,
    ease: 'power3.out',
    delay: 0.15,
  })

  gsap.from('.hero-sub', {
    opacity: 0,
    y: 30,
    duration: 0.9,
    stagger: 0.15,
    ease: 'power3.out',
    delay: 0.9,
  })

  gsap.from('.hero-cta', {
    opacity: 0,
    y: 25,
    duration: 0.9,
    ease: 'power3.out',
    delay: 1.25,
  })
}

// ─── Stats bar: count-up on scroll entry ──────────────────────────────────────
document.querySelectorAll('[data-count]').forEach((el) => {
  const target = parseFloat(el.dataset.count)
  const duration = parseFloat(el.dataset.duration) || 2
  const prefix = el.dataset.prefix || ''
  const suffix = el.dataset.suffix || ''
  const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0

  ScrollTrigger.create({
    trigger: el,
    start: 'top 85%',
    once: true,
    onEnter: () => {
      const obj = { val: 0 }
      gsap.to(obj, {
        val: target,
        duration,
        ease: 'power2.out',
        onUpdate() {
          const v = obj.val
          const formatted =
            decimals > 0
              ? v.toFixed(decimals)
              : Math.round(v).toLocaleString()
          el.textContent = prefix + formatted + suffix
        },
      })
    },
  })
})

// ─── Zero stat: pulse/flash on entry to emphasise ────────────────────────────
const zeroEl = document.querySelector('[data-zero-pulse]')
if (zeroEl) {
  ScrollTrigger.create({
    trigger: zeroEl,
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.fromTo(
        zeroEl,
        { scale: 1 },
        {
          scale: 1.15,
          duration: 0.12,
          repeat: 5,
          yoyo: true,
          ease: 'power2.inOut',
          onComplete: () => gsap.set(zeroEl, { scale: 1, clearProps: 'transform' }),
        }
      )
    },
  })
}

// ─── Manifesto: call-and-response stagger ─────────────────────────────────────
document.querySelectorAll('.manifesto-group').forEach((group) => {
  const beats = group.querySelectorAll('.manifesto-beat')
  beats.forEach((beat, i) => {
    gsap.from(beat, {
      scrollTrigger: { trigger: group, start: 'top 82%', once: true },
      opacity: 0,
      y: 30,
      duration: 0.75,
      delay: i * 0.28,
      ease: 'power3.out',
    })
  })
})

// ─── HowItWorks: animated S-curve connector ────────────────────────────────────
const howItWorksPath = document.querySelector('#how-it-works-path')
if (howItWorksPath) {
  const length = howItWorksPath.getTotalLength()
  const dots = document.querySelectorAll('.how-it-works-dot')

  gsap.set(howItWorksPath, { strokeDasharray: length, strokeDashoffset: length })
  gsap.set(dots, { scale: 0, opacity: 0, transformOrigin: 'center center' })

  gsap.to(howItWorksPath, {
    strokeDashoffset: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '#how-it-works-steps',
      start: 'top 65%',
      end: 'bottom 55%',
      scrub: 1.5,
    },
  })

  document.querySelectorAll('.how-it-works-step').forEach((step, i) => {
    const dot = dots[i]
    if (!dot) return
    ScrollTrigger.create({
      trigger: step,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        gsap.to(dot, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2.5)', delay: 0.15 })
      },
    })
  })
}
