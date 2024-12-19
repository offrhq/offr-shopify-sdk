# Offr Shopify Example Endpoint

Use this template to create an endpoint to calculate pricing for your shoppers.

1. `/src/index.ts` the entry point which responds to HTTP requests
2. `/src/example.ts` provides the actual pricing calculations

## Hosting

Your HTTP endpoint can be setup however you like (any OS, any language, etc).
However, since you already need JavaScript for your shopper's browser
experience, we'll stick with that language and build our example for Deno
Deploy.

### Hosting with Deno Deploy

If you aren't familiar,
[Deno is an improvement on NodeJS](https://deno.com/learn/nodes-complexity-problem)
for JavaScript / TypeScript.
[Deno Deploy offers hosting which is easy, fast, and free](https://deno.com/deploy).
You can get started with
[Deno in VS Code](https://github.com/denoland/vscode_deno) in seconds. To create
your endpoint on Deno Deploy:

1. Fork this repo
2. [Connect](https://docs.deno.com/deploy/manual/how-to-deploy/) your Deno
   Deploy account to your forked git repo
3. 🎉 Push to deploy!
