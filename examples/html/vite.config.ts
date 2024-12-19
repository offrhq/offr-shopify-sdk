import { defineConfig } from "npm:vite@6.0.3";
import { viteSingleFile } from "npm:vite-plugin-singlefile@2.1.0";
import { createHtmlPlugin } from "npm:vite-plugin-html@3.2.2";

export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    emptyOutDir: false,
  },
  plugins: [
    /**
     * bundles css/js, deletes inlined files
     * https://github.com/richardtallent/vite-plugin-singlefile
     */
    viteSingleFile({ removeViteModuleLoader: true }),

    /**
     * minify the html
     * https://github.com/vbenjs/vite-plugin-html
     */
    createHtmlPlugin({ minify: true }),

    /**
     * Add build time to html output
     * https://vite.dev/guide/api-plugin#transformindexhtml
     *
     * since htmlPlugin aggressively removes comments, we use meta
     */
    {
      transformIndexHtml(html) {
        return (
          `<meta build-timestamp="${new Date()
            .toISOString()
            .substring(0, 19)}" />\n` + html
        );
      },
    },
  ],
});
