import { readFile } from "fs/promises";
import { createServer } from "http";
import { join } from "path";
import { promisify } from "util";
import { beforeAll, describe, expect, it } from "vitest";

import { createApp } from "../app.js";
import {
  createMockAPI,
  knownPostId,
  knownUsername,
  unknownPostId,
  unknownUsername,
} from "./mock-api.js";

const webRoot = join(__dirname, "webroot");

/**
 * @param {import("net").AddressInfo} address
 * @returns {string}
 */
function addrToURL(address) {
  if (address.family === "IPv4") {
    return `http://${address.address}:${address.port}`;
  }
  return `http://[${address.address}]:${address.port}`;
}

describe("App", () => {
  /** @type {string} */
  let rootURL;

  beforeAll(async () => {
    const apiAddress = await createMockAPI();
    const app = createApp(
      webRoot,
      join(webRoot, "config.json"),
      addrToURL(apiAddress)
    );
    const server = createServer(app.callback());
    await promisify(server.listen.bind(server))();

    rootURL = addrToURL(
      /** @type {import("net").AddressInfo} */ (server.address())
    );
  });

  /**
   * @param {string} path
   * @param {{[k: string]: string}} headers
   */
  async function expectResource(path, headers) {
    const res = await fetch(rootURL + path);
    expect(res.ok).toBe(true);
    for (const k in headers) {
      expect(res.headers.get(k)).toBe(headers[k]);
    }
    const [fileContent, responseContent] = await Promise.all([
      readFile(join(webRoot, path), "utf8"),
      res.text(),
    ]);
    expect(responseContent).toBe(fileContent);
  }

  it("should return asset", () =>
    expectResource("/assets/some-script.js", {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "max-age=31536000, immutable",
    }));

  it("should return non-cacheable asset", () =>
    expectResource("/assets/js/bookmarklet-popup.js", {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache",
    }));

  it("should return 'auth-return.html'", () =>
    expectResource("/auth-return.html", {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    }));

  it("should not return nonexisting asset", async () => {
    const path = "/assets/not-exists.js";
    const res = await fetch(rootURL + path);
    expect(res.status).toBe(404);
  });

  it("should return '/' with replaced placeholders", async () => {
    const res = await fetch(`${rootURL}/`);
    expect(res.ok).toBe(true);
    expect(res.headers.get("Cache-Control")).toBe("no-cache");

    await expect(res.text()).resolves.toMatchSnapshot();
  });

  it(`should return unknown post of ${unknownUsername} with replaced placeholders`, async () => {
    const res = await fetch(`${rootURL}/${unknownUsername}/${unknownPostId}`);
    expect(res.ok).toBe(true);
    await expect(res.text()).resolves.toMatchSnapshot();
  });

  it(`should return known post of ${unknownUsername} with replaced placeholders`, async () => {
    const res = await fetch(`${rootURL}/${unknownUsername}/${knownPostId}`);
    expect(res.ok).toBe(true);
    await expect(res.text()).resolves.toMatchSnapshot();
  });

  it(`should return unknown post of ${knownUsername} with replaced placeholders`, async () => {
    const res = await fetch(`${rootURL}/${knownUsername}/${unknownPostId}`);
    expect(res.ok).toBe(true);
    await expect(res.text()).resolves.toMatchSnapshot();
  });

  it(`should return known post of ${knownUsername} with replaced placeholders`, async () => {
    const res = await fetch(`${rootURL}/${knownUsername}/${knownPostId}`);
    expect(res.ok).toBe(true);
    await expect(res.text()).resolves.toMatchSnapshot();
  });

  it(`should return some arbitrary page`, async () => {
    const res = await fetch(`${rootURL}/some-unknown/page`);
    expect(res.ok).toBe(true);
    await expect(res.text()).resolves.toMatchSnapshot();
  });
});
