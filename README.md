# Offr Shopify SDK

This repo helps you create [Offr(s) for Shopify](https://apps.shopify.com/offr)
with native support for TypeScript. It contains:

- `examples`: quick-starts to create your own Offrs.
  - `endpoint` host your own offr calculations
  - `html` bundle HTML, CSS, and script to an efficient HTML file for Offr
- `lib`: utilities and types for your code

# Requirements

1. Deno ^2.0.2 - [here's why](/examples/html). If you aren't familiar,
   [Deno is an improvement over NodeJS](https://deno.com/learn/nodes-complexity-problem)
   for JavaScript / TypeScript.
2. Once you install the CLI, you should
   [setup your editor](https://docs.deno.com/runtime/getting_started/setup_your_environment).

# How To

To get started: `git clone https://github.com/offrhq/offr-shopify-sdk my-offr`.

Suppose you want to update the pricing of the example fish tank Offr:

1. In [`examples/endpoint`](/examples/endpoint) you make the appropriate change.
2. You push your changes to your free Deno server.
3. Edit [`examples/html`](/examples/html) to add a sale banner to your product
   page.
4. `deno task html:build` to bundle your changes.
5. Copy the newest code in [`examples/html/dist`](/examples/html/dist) to your
   Offr within Shopify admin.

# CLI

Our SDK CLI is built with Vite and Deno. You can use the CLI to build your code.
For example (from the root of the repository):

```shell
# edit your html with instant updates in-browser
deno task html:dev

# minify your html so it is ready to add as an Offr
deno task html:build
```

You can see all available tasks in [`deno.jsonc`](deno.jsonc)

# Contributing

If you are a developer with questions, please post in discussions before raising
an issue. PRs welcome.
