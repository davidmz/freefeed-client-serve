import "dotenv/config";

import { join } from "path";

import { createApp } from "./app.js";

const defaultPort = "4444";
const defaultAPIRoot = "https://candy.freefeed.net";

const port = Number.parseInt(process.env["PORT"] || defaultPort);
const apiRoot = process.env["API_ROOT"] || defaultAPIRoot;
const webRoot = process.env["WEB_ROOT"];
const devMode = process.env["DEV"] === "true";

if (!webRoot) {
  // eslint-disable-next-line no-console
  console.error(
    "You MUST specify a web root!\nSet WEB_ROOT to path to the FreeFeed client web root folder."
  );
  process.exit(1);
}

if (!(port > 0 && port < 65536)) {
  // eslint-disable-next-line no-console
  console.error("Invalid port value: " + process.env["PORT"]);
  process.exit(1);
}

const configPath = join(webRoot, devMode ? ".." : ".", "config.json");

const app = createApp(webRoot, configPath, apiRoot);

// eslint-disable-next-line no-console
console.log("Serving", webRoot, "(set WEB_ROOT to change)");
// eslint-disable-next-line no-console
console.log("Listening at", port, "(set PORT to change)");
app.listen(port);
