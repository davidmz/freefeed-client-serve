# freefeed-client-serve

Simple app that serves a
[freefeed-react-client](https://github.com/FreeFeed/freefeed-react-client/)'s
files. Most files are served unchanged, except for _index.html_.

In the index.html, this app makes the following replacements:

- The `<!--FREEFEED_CUSTOM_CONFIG-->` placeholder is replaced by `<script>window.CONFIG_PATCH = {...};</script>`, where _{...}_ is the contents of the custom config file, _config.json_, which is located near _index.html_.
- The `<!--FREEFEED_POSTS_OPENGRAPH-->` is replaced with `GET /v2/posts-opengraph/:postId` request result.
- The `<!--FREEFEED_TIMELINE_METATAGS-->` is replaced with `GET /v2/timelines-metatags/:username` request result.

## Usage

Perform `yarn start` to run the application. Use environment variables for
configuration (see the [.env](.env) file for comments and defaults). You must specify at
least one variable, the `WEB_ROOT`. It defines the path to the FreeFeed client
folder (where the 'index.html' is located).
