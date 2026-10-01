globalThis.process ??= {}; globalThis.process.env ??= {};
import './chunks/astro-designed-error-pages_asdjUqn4.mjs';
import './chunks/astro/server_AuywLpX0.mjs';
import { s as sequence } from './chunks/index_DqQfVz37.mjs';

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
