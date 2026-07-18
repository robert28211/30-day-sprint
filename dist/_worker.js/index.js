globalThis.process ??= {}; globalThis.process.env ??= {};
import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CrZyF4mt.mjs';
import { manifest } from './manifest_DqjjpT0V.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/onboarding.astro.mjs');
const _page2 = () => import('./pages/api/score-gate.astro.mjs');
const _page3 = () => import('./pages/api/snapshot.astro.mjs');
const _page4 = () => import('./pages/b2b.astro.mjs');
const _page5 = () => import('./pages/diagnosis/no-action.astro.mjs');
const _page6 = () => import('./pages/diagnosis/not-seen.astro.mjs');
const _page7 = () => import('./pages/diagnosis/not-trusted.astro.mjs');
const _page8 = () => import('./pages/diagnosis/still-compared.astro.mjs');
const _page9 = () => import('./pages/diagnostic.astro.mjs');
const _page10 = () => import('./pages/downloads/_file_.astro.mjs');
const _page11 = () => import('./pages/fm1.astro.mjs');
const _page12 = () => import('./pages/fm2.astro.mjs');
const _page13 = () => import('./pages/fm3.astro.mjs');
const _page14 = () => import('./pages/fm4.astro.mjs');
const _page15 = () => import('./pages/how-it-works.astro.mjs');
const _page16 = () => import('./pages/img/_file_.astro.mjs');
const _page17 = () => import('./pages/onboarding.astro.mjs');
const _page18 = () => import('./pages/playbook/thank-you.astro.mjs');
const _page19 = () => import('./pages/playbook.astro.mjs');
const _page20 = () => import('./pages/preview.astro.mjs');
const _page21 = () => import('./pages/privacy.astro.mjs');
const _page22 = () => import('./pages/recovery.astro.mjs');
const _page23 = () => import('./pages/score.astro.mjs');
const _page24 = () => import('./pages/snapshot/booked.astro.mjs');
const _page25 = () => import('./pages/snapshot/plastic-surgery.astro.mjs');
const _page26 = () => import('./pages/snapshot/_id_.astro.mjs');
const _page27 = () => import('./pages/snapshot.astro.mjs');
const _page28 = () => import('./pages/the-build.astro.mjs');
const _page29 = () => import('./pages/toolkit.astro.mjs');
const _page30 = () => import('./pages/videos.astro.mjs');
const _page31 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js", _page0],
    ["src/pages/api/onboarding.ts", _page1],
    ["src/pages/api/score-gate.ts", _page2],
    ["src/pages/api/snapshot.ts", _page3],
    ["src/pages/b2b.astro", _page4],
    ["src/pages/diagnosis/no-action.astro", _page5],
    ["src/pages/diagnosis/not-seen.astro", _page6],
    ["src/pages/diagnosis/not-trusted.astro", _page7],
    ["src/pages/diagnosis/still-compared.astro", _page8],
    ["src/pages/diagnostic.astro", _page9],
    ["src/pages/downloads/[file].ts", _page10],
    ["src/pages/fm1.astro", _page11],
    ["src/pages/fm2.astro", _page12],
    ["src/pages/fm3.astro", _page13],
    ["src/pages/fm4.astro", _page14],
    ["src/pages/how-it-works.astro", _page15],
    ["src/pages/img/[file].ts", _page16],
    ["src/pages/onboarding/index.astro", _page17],
    ["src/pages/playbook/thank-you.astro", _page18],
    ["src/pages/playbook/index.astro", _page19],
    ["src/pages/preview.astro", _page20],
    ["src/pages/privacy.astro", _page21],
    ["src/pages/recovery/index.astro", _page22],
    ["src/pages/score/index.astro", _page23],
    ["src/pages/snapshot/booked.astro", _page24],
    ["src/pages/snapshot/plastic-surgery/index.astro", _page25],
    ["src/pages/snapshot/[id].astro", _page26],
    ["src/pages/snapshot/index.astro", _page27],
    ["src/pages/the-build.astro", _page28],
    ["src/pages/toolkit/index.astro", _page29],
    ["src/pages/videos.astro", _page30],
    ["src/pages/index.astro", _page31]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = undefined;
const _exports = createExports(_manifest);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
