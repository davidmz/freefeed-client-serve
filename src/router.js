import {
  bunch,
  createRouter as makeRouter,
  route,
  split,
} from "@davidmz/just-router";
import send from "koa-send";

/**
 * @typedef {import("koa").Context} Context
 * @typedef {(ctx: Context) => Promise<void>} Handler
 * @typedef {import("@davidmz/just-router").Router<Handler>} Router
 */

/**
 * @param {string} webRoot
 * @param {Handler} indexHandler
 * @returns {Router}
 */
export function createRouter(webRoot, indexHandler) {
  const nonCacheablePaths = [
    "assets/js/bookmarklet-popup.js",
    "auth-return.html",
    "version.txt",
  ];

  return makeRouter(
    bunch(
      ...nonCacheablePaths.map((path) =>
        route(split(path), () => sendNonCacheable(webRoot))
      ),
      route(
        "assets",
        bunch(() => sendCacheable(webRoot))
      ),
      () => indexHandler
    )
  );
}

/**
 * @param {string} root
 * @returns {Handler}
 */
function sendNonCacheable(root) {
  return async (/** @type {Context} */ ctx) => {
    await send(ctx, ctx.path, {
      root,
      setHeaders: (res) => res.setHeader("Cache-Control", "no-cache"),
    });
  };
}

/**
 * @param {string} root
 * @returns {Handler}
 */
function sendCacheable(root) {
  return async (/** @type {import("koa").Context} */ ctx) => {
    await send(ctx, ctx.path, {
      root,
      setHeaders: (res) =>
        res.setHeader("Cache-Control", "max-age=31536000, immutable"),
    });
  };
}
