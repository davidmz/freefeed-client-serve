import { ReadStream } from "fs";
import { readFile } from "fs/promises";
import send from "koa-send";
import { join } from "path";

import { fetchPostOpenGraph, fetchTimelineMetaTags } from "./freefeed-api.js";

/**
 * @typedef {import("koa").Middleware} Middleware
 */

export const noCache = "no-cache";
export const maxCache = "public, max-age=31536000, immutable";

/**
 * @returns {Middleware}
 */
export function allowedMethodsHandler() {
  return async (ctx, next) => {
    if (ctx.method === "GET") {
      await next();
    } else if (ctx.method === "HEAD") {
      await next();
      ctx.body = "";
    } else {
      ctx.status = 405;
      ctx.set("Allow", "GET, HEAD");
    }
  };
}

/**
 * @param {string} webRoot
 * @returns {Middleware}
 */
export function staticHandler(webRoot) {
  const assetsDir = join(webRoot, "assets/");
  const nonCacheableAssets = ["assets/js/bookmarklet-popup.js"].map((p) =>
    join(webRoot, p)
  );

  return async (ctx, next) => {
    // First, trying to send static file, but not "index.html"
    try {
      const resolvedPath = await send(ctx, ctx.path, {
        root: webRoot,
        format: false,
        setHeaders: (res, path) => {
          if (
            path.startsWith(assetsDir) &&
            !nonCacheableAssets.includes(path)
          ) {
            res.setHeader("Cache-Control", maxCache);
          } else {
            res.setHeader("Cache-Control", noCache);
          }
        },
      });
      // It is "/" or "/index.html"
      if (!resolvedPath || resolvedPath === join(webRoot, "index.html")) {
        await next();
      }
    } catch (err) {
      // @ts-ignore
      if (err.status === 404) {
        await next();
      } else {
        throw err;
      }
    }
  };
}

/**
 * @param {string} webRoot
 * @param {string} configPath
 * @param {string} apiRoot
 * @returns {Middleware}
 */
export function indexHandler(webRoot, configPath, apiRoot) {
  return async (ctx) => {
    // Now dealing with 'index.html'
    const [indexContent, customConfig] = await Promise.all([
      // 'send' can already read index.html into stream
      ctx.body instanceof ReadStream
        ? readStream(ctx.body)
        : readFile(join(webRoot, "index.html"), "utf8"),
      readFile(configPath, "utf8").then(
        (data) => JSON.parse(data),
        (err) => {
          if (err.code !== "ENOENT") {
            throw err;
          }
          return {};
        }
      ),
    ]);
    apiRoot = customConfig.api?.root || apiRoot;

    const [postOpenGraph, timelineMetaTags] = await Promise.all([
      fetchPostOpenGraph(ctx.path, apiRoot),
      fetchTimelineMetaTags(ctx.path, apiRoot),
    ]);

    ctx.status = 200;
    ctx.set("Content-Type", "text/html; charset=utf-8");
    ctx.set("Cache-Control", noCache);
    ctx.body = indexContent
      .replace(
        /<!--\s*FREEFEED_CUSTOM_CONFIG\s*-->/,
        `<script>window.CONFIG_PATCH = ${JSON.stringify(
          customConfig
        )};</script>`
      )
      .replace(/<!--\s*FREEFEED_POSTS_OPENGRAPH\s*-->/, postOpenGraph)
      .replace(/<!--\s*FREEFEED_TIMELINE_METATAGS\s*-->/, timelineMetaTags);
  };
}

/**
 * @see https://stackoverflow.com/a/63361543
 * @param {import("stream").Readable} stream
 * @returns {Promise<string>}
 */
async function readStream(stream) {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf-8");
}
