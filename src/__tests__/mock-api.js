import Router from "@koa/router";
import { createServer } from "http";
import Koa from "koa";
import { promisify } from "util";

export const knownPostId = "00000000-0000-0000-0000-000000000123";
export const knownUsername = "johnsnow";

export const unknownPostId = "00000000-0000-0000-0000-000000000321";
export const unknownUsername = "lunalovegood";

/**
 * @returns {Promise<import("net").AddressInfo>}
 */
export async function createMockAPI() {
  const app = createMockApp();
  const server = createServer(app.callback());
  await promisify(server.listen.bind(server))();

  return /** @type {import("net").AddressInfo} */ (server.address());
}

function createMockApp() {
  const router = new Router()
    .get("/v2/posts-opengraph/:postId", (ctx) => {
      ctx.body =
        ctx.params["postId"] === knownPostId
          ? `OpenGraph for [${ctx.params["postId"]}]`
          : "";
    })
    .get("/v2/timelines-metatags/:username", (ctx) => {
      ctx.body =
        ctx.params["username"] === knownUsername
          ? `Metatags for @${ctx.params["username"]}`
          : "";
    });

  return new Koa().use(router.routes()).use(router.allowedMethods());
}
