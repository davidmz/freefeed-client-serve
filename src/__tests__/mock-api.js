import { bunch, createRouter, param, route } from "@davidmz/just-router";
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
  const app = new Koa();

  /** @type {import("@davidmz/just-router").Router<(c: Koa.Context) => void>}*/
  const router = createRouter(
    route(
      "v2",
      bunch(
        route("posts-opengraph", param("postId"), (rc) => (ctx) => {
          ctx.body = "";
          if (rc.pathParams["postId"] === knownPostId) {
            ctx.body = `OpenGraph for [${rc.pathParams["postId"]}]`;
          }
        }),
        route("timelines-metatags", param("username"), (rc) => (ctx) => {
          ctx.body = "";
          if (rc.pathParams["username"] === knownUsername) {
            ctx.body = `Metatags for @${rc.pathParams["username"]}`;
          }
        })
      )
    )
  );
  app.use((ctx) => router(ctx.path)(ctx));
  return app;
}
