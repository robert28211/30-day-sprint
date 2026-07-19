globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, m as maybeRenderHead, k as renderComponent, o as Fragment, r as renderTemplate, h as createAstro, g as addAttribute } from './astro/server_CdzYR9DH.mjs';
/* empty css                         */

const $$Astro = createAstro();
const $$ProofCards = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ProofCards;
  const { cards = [], foot = "", video = null } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<section class="mp-proofband" data-astro-cid-xa7z4mqp> <div class="mp-proofband-inner" data-astro-cid-xa7z4mqp> ${cards.map((c, i) => renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "data-astro-cid-xa7z4mqp": true }, { "default": ($$result2) => renderTemplate`${video && i === 1 && renderTemplate`<article class="mp-pcard mp-pcard-video" data-animate data-delay="0.03" data-astro-cid-xa7z4mqp> <div class="mp-pcard-video-frame" data-astro-cid-xa7z4mqp> <video${addAttribute(video.poster, "poster")} preload="none" playsinline controls data-astro-cid-xa7z4mqp> <source${addAttribute(video.src, "src")} type="video/mp4" data-astro-cid-xa7z4mqp> </video> </div> <p class="mp-pcard-video-label" data-astro-cid-xa7z4mqp>${video.label}</p> </article>`}<article${addAttribute(`mp-pcard ${c.featured ? "mp-pcard-featured" : ""}`, "class")} data-animate${addAttribute((i * 0.03).toFixed(2), "data-delay")} data-astro-cid-xa7z4mqp> <p class="mp-pcard-trade" data-astro-cid-xa7z4mqp>${c.trade} ${c.loc && renderTemplate`<span class="mp-pcard-loc" data-astro-cid-xa7z4mqp>${c.loc}</span>`}</p> <p class="mp-pcard-num" data-astro-cid-xa7z4mqp>${c.num}</p> <p class="mp-pcard-unit" data-astro-cid-xa7z4mqp>${c.unit}</p> <p${addAttribute(`mp-pcard-market ${c.down ? "mp-down" : "mp-flat"}`, "class")} data-astro-cid-xa7z4mqp>${c.market}</p> </article> ` })}`)} </div> ${foot && renderTemplate`<p class="mp-proofband-foot" data-astro-cid-xa7z4mqp>${foot}</p>`} </section> `;
}, "/Users/robbiebutt/.claude/worktrees/video-hub/src/components/ProofCards.astro", void 0);

export { $$ProofCards as $ };
