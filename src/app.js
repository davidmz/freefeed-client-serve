import Koa from "koa";
import conditionalGet from "koa-conditional-get";
import etag from "koa-etag";

import { handleIndex } from "./handle-index.js";
import { createRouter } from "./router.js";

/**
 * @param {string} webRoot
 * @param {string} configPath
 * @param {string} apiRoot
 */
export function createApp(webRoot, configPath, apiRoot) {
  const router = createRouter(
    webRoot,
    handleIndex(webRoot, configPath, apiRoot)
  );

  const app = new Koa();
  app.use(conditionalGet());
  app.use(async (ctx, next) => {
    if (ctx.method === "GET") {
      await next();
    } else if (ctx.method === "HEAD") {
      await next();
      ctx.body = "";
    } else {
      ctx.status = 405;
      ctx.set("Allow", "GET, HEAD");
    }
  });
  app.use(etag());
  app.use((ctx) => router(ctx.path)(ctx));
  return app;
}
