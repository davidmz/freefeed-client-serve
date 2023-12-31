import Koa from "koa";
import conditionalGet from "koa-conditional-get";
import etag from "koa-etag";

import {
  allowedMethodsHandler,
  indexHandler,
  staticHandler,
} from "./handlers.js";

/**
 * @param {string} webRoot
 * @param {string} configPath
 * @param {string} apiRoot
 */
export function createApp(webRoot, configPath, apiRoot) {
  const app = new Koa();
  app
    .use(conditionalGet())
    .use(etag())
    .use(allowedMethodsHandler())
    .use(staticHandler(webRoot))
    .use(indexHandler(webRoot, configPath, apiRoot));
  return app;
}
