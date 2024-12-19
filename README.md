# Offr Shopify Examples

This repo contains examples / templates which you can use to create your own
Offrs.

## Generate Endpoint Types

Although you probably won't need to do this, we provide a code generator to
avoid the labor of recreating Shopify's GraphQL schema within TypeScrip. The
generated TypeScript file can be added to the repo. For example: we already
include `admin.2024-07.graphql.ts`

```shell
deno run --allow-env --allow-sys --allow-read --allow-write ./examples/endpoint/src/shopify/_codegen.ts
```
