# Offr Shopify SDK

This repo helps you create Offrs for Shopify with native support for TypeScript.
It contains:

- `examples`: quick-starts to create your own Offrs.
  - `endpoint` host your own offr calculations
  - `html` bundle HTML, CSS, and script to an efficient HTML file for Offr
- `lib`: utilities and types for your code

# CLI

Our SDK CLI is built with Vite and Deno. You can use the CLI to build your code.
For example (from the root of the repository):

```shell
# edit your html with instant updates in-browser
deno task html:dev

# minify your html so it is ready to add as an Offr
deno task html:build
```
