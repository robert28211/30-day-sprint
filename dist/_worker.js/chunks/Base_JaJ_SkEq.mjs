globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, r as renderTemplate, l as renderScript, ao as renderSlot, p as renderHead, g as addAttribute, h as createAstro } from './astro/server_CdzYR9DH.mjs';
/* empty css                       */

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$Base = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Base;
  const {
    title = "Marketing Performance Group \u2014 EngageEngine\u2122",
    description = "You are losing the demand you already paid for before it becomes revenue. Find exactly where \u2014 and fix it."
  } = Astro2.props;
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>', '</title><meta name="description"', `><!-- Google Analytics --><script async src="https://www.googletagmanager.com/gtag/js?id=G-7CF3328ZK0"><\/script><script>
      window.dataLayer = window.dataLayer || [];
      window.gtag = function(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-7CF3328ZK0');
    <\/script><!-- Microsoft Clarity --><script type="text/javascript">
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "v5zy2jqg2w");
    <\/script><!-- Identity Resolution Pixel --><script src="https://cdn.idpixel.app/v1/idp-analytics-6990fa8981c12e22bc596313.min.js" defer><\/script><!-- Meta Pixel stub \u2014 queue only, no network call in <head> --><script>
      window.fbq=window.fbq||function(){(window._fbq=window._fbq||[]).push(arguments)};
      window._fbq=window._fbq||[];
    <\/script>`, "</head> <body> ", ` <!-- Meta Pixel load \u2014 deferred to after LCP to avoid render-blocking --> <script>
      !function(f,b,e,v,n,t,s)
      {if(f.fbq&&f.fbq.loaded)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=(window._fbq||[]);t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '1362717861424529');
      fbq('track', 'PageView');
    <\/script> <noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1362717861424529&ev=PageView&noscript=1"></noscript> `, "</body></html>"])), title, addAttribute(description, "content"), renderHead(), renderSlot($$result, $$slots["default"]), renderScript($$result, "/Users/robbiebutt/.claude/worktrees/youthful-tu/src/layouts/Base.astro?astro&type=script&index=0&lang.ts"));
}, "/Users/robbiebutt/.claude/worktrees/youthful-tu/src/layouts/Base.astro", void 0);

export { $$Base as $ };
