globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createAstro, f as createComponent } from '../chunks/astro/server_AuywLpX0.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://marketingperformance.net");
const prerender = false;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  return Astro2.redirect("/diagnostic/", 301);
}, "/Users/robbiebutt/.claude/worktrees/mpn-referral-hero/src/pages/toolkit/index.astro", void 0);

const $$file = "/Users/robbiebutt/.claude/worktrees/mpn-referral-hero/src/pages/toolkit/index.astro";
const $$url = "/toolkit";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	prerender,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
