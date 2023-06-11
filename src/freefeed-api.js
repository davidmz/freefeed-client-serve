import fetch from "node-fetch";

/**
 * @param {string} path
 * @param {string} apiRoot
 * @returns {Promise<string>}
 */
export async function fetchPostOpenGraph(path, apiRoot) {
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
export async function fetchTimelineMetaTags(path, apiRoot) {
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
