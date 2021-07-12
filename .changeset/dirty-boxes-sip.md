---
'@sveltejs/vite-plugin-svelte': patch
---

removed redundant `disableCssHmr` option

You can use `emitCss: false` or `emitCss: !!isProduction` instead
