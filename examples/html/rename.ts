// inject the date into the file name so user can check versions / revert
Deno.rename(
  "./dist/index.html",
  `./dist/offr-${new Date().toISOString().substring(0, 19)}.html`
);
