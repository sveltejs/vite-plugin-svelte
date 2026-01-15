---
'@sveltejs/vite-plugin-svelte': major
---

breaking(options): remove deprecated options

- `vitePlugin.hot` in `svelte.config.js`
  use `compilerOptions.hmr` instead
- `vitePlugin.ignorePluginPreprocessors` in `svelte.config.js`
  o longer needed
- `vite-plugin-svelte:api` `api.idFilter`
  use `api.idFilter` instead
- `plugin.api.sveltePreprocess` in other vite plugins
  Update affected plugins to a newer version or remove them.
  See [docs](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/advanced-usage.md#transform-svelte-files-with-vite-plugins) for more information.
