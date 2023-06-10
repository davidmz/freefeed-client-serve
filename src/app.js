import Koa from "koa";
import conditionalGet from "koa-conditional-get";
import mount from "koa-mount";
import send from "koa-send";
import serve from "koa-static";
import { join } from "path";

import { handleIndex } from "./handle-index.js";

/**
 * @param {string} webRoot
 * @param {string} configPath
 * @param {string} apiRoot
 */
export function createApp(webRoot, configPath, apiRoot) {
  const app = new Koa();

  app.use(conditionalGet());

  const nonCacheablePaths = ["/assets/js/bookmarklet-popup.js"];
  app.use(
    mount(
      "/assets",
      serve(join(webRoot, "assets"), {
        setHeaders: (res, path) => {
          if (nonCacheablePaths.includes(path)) {
            res.setHeader("Cache-Control", "no-cache");
          } else {
            res.setHeader("Cache-Control", "max-age=31536000, immutable");
          }
        },
      })
    )
  );
  app.use(
    mount("/auth-return.html", (ctx) =>
      send(ctx, "auth-return.html", {
        root: webRoot,
        setHeaders: (res) => res.setHeader("Cache-Control", "no-cache"),
      })
    )
  );

  app.use(handleIndex(webRoot, configPath, apiRoot));
  return app;
}
