globalThis.process ??= {}; globalThis.process.env ??= {};
import './chunks/astro-designed-error-pages_HgYkdsg-.mjs';
import './chunks/astro/server_CdzYR9DH.mjs';
import { s as sequence } from './chunks/index_Dy12JBRN.mjs';

const onRequest$1 = (context, next) => {
  if (context.isPrerendered) {
    context.locals.runtime ??= {
      env: process.env
    };
  }
  return next();
};

const onRequest = sequence(
	onRequest$1,
	
	
);

export { onRequest };
