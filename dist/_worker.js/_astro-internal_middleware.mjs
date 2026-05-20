globalThis.process ??= {}; globalThis.process.env ??= {};
import './chunks/astro-designed-error-pages_L8lfEEnB.mjs';
import './chunks/astro/server_BfPsWbN8.mjs';
import { s as sequence } from './chunks/index_go76eEXi.mjs';

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
