---
'@sveltejs/vite-plugin-svelte': minor
---

Move plugin preprocessor definition to api namespace

Plugins that provide `myplugin.sveltePreprocess`, should move it to `myplugin.api.sveltePreprocess`, as suggested by [rollup](https://rollupjs.org/guide/en/#direct-plugin-communication)
