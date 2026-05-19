globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../renderers.mjs';

const prerender = false;
const MIME = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp"
};
const GET = async ({ params, locals }) => {
  const file = params.file;
  if (!file) return new Response("Not found", { status: 404 });
  if (!/^[\w\-]+\.(png|jpg|jpeg|gif|webp)$/i.test(file)) {
    return new Response("Invalid filename", { status: 400 });
  }
  const bucket = locals.runtime?.env?.PDFS;
  if (!bucket) return new Response("Storage unavailable", { status: 503 });
  const object = await bucket.get(file);
  if (!object) return new Response("Not found", { status: 404 });
  const ext = file.split(".").pop().toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";
  return new Response(object.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*"
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
