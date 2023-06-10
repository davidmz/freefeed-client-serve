import { readFile } from "fs/promises";
import { join } from "path";

/**
 * @param {string} webRoot
 * @param {string} configPath
 * @param {string} apiRoot
 */
export function handleIndex(webRoot, configPath, apiRoot) {
  /**
   * @param {import("koa").Context} ctx
   */
  return async function (ctx) {
    const [indexContent, customConfig] = await Promise.all([
      readFile(join(webRoot, "index.html"), "utf8"),
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

    ctx.set("Content-Type", "text/html; charset=utf8");
    ctx.set("Cache-Control", "no-cache");
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
 * @param {string} path
 * @param {string} apiRoot
 * @returns {Promise<string>}
 */
async function fetchPostOpenGraph(path, apiRoot) {
  const match = /^\/[a-zA-Z\d]+\/([a-fA-F\d-]{36})/.exec(path);
  if (!match) {
    return "";
  }
  const postId = match[1];
  const resp = await fetch(`${apiRoot}/v2/posts-opengraph/${postId}`);
  if (!resp.ok) {
    return "";
  }

  return resp.text();
}

/**
 * @param {string} path
 * @param {string} apiRoot
 * @returns {Promise<string>}
 */
async function fetchTimelineMetaTags(path, apiRoot) {
  const match = /^\/([a-zA-Z\d]+)/.exec(path);
  if (!match) {
    return "";
  }
  const username = match[1];
  const resp = await fetch(`${apiRoot}/v2/timelines-metatags/${username}`);
  if (!resp.ok) {
    return "";
  }

  return resp.text();
}
