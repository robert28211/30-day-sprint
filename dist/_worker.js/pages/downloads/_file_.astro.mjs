globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../renderers.mjs';

const prerender = false;
const ALLOWED = /* @__PURE__ */ new Set([
  "full-toolkit.zip",
  "fm1-toolkit.zip",
  "fm2-toolkit.zip",
  "fm3-toolkit.zip",
  "fm4-toolkit.zip"
]);
const GET = async ({ params, locals }) => {
  const file = params.file;
  if (!file || !ALLOWED.has(file)) {
    return new Response("Not found", { status: 404 });
  }
  const bucket = locals.runtime?.env?.PDFS;
  if (!bucket) {
    return new Response("Storage unavailable", { status: 503 });
  }
  const object = await bucket.get(file);
  if (!object) {
    return new Response("File not found", { status: 404 });
  }
  return new Response(object.body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "private, max-age=3600"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
