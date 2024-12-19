import { defineConfig } from "npm:vite@6.0.3";
import { RollupOptions } from "npm:rollup@4.29.0-0";

export default defineConfig({
  base: "./",

  // replace text
  define: {
    // __PUBLIC_SHOPIFY_APP_HANDLE__: `"offr"`,
    __PUBLIC_SHOPIFY_APP_HANDLE__: `"offr-dev"`,
  },

  build: {
    sourcemap: true,

    rollupOptions: {
      // build index.ts (not index.html)
      input: "./src/index.ts",

      output: {
        // rename to offr.js
        entryFileNames: "offr.js",
        /**
         * Save the source map as a custom name.
         *
         * Shopify rejects standard *.map. Throws:
         * `assets directory should only contain .jpg, .jpeg, .js, .css, .png, .svg, .json, .wasm files`
         */
        sourcemapFileNames: "offr.js.map.json",
      },
    } satisfies RollupOptions,
  },
});
