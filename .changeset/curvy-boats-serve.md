---
'@sveltejs/vite-plugin-svelte': major
---

breaking(options): remove deprecated options

- `vitePlugin.hot` in `svelte.config.js`
  use `compilerOptions.hmr` instead
- `vitePlugin.ignorePluginPreprocessors` in `svelte.config.js`
  no longer needed
- `api.idFilter` of `vite-plugin-svelte:api`
  use `api.filter` instead
- `plugin.api.sveltePreprocess` of other vite plugins
  Update affected plugins to a newer version or remove them.
  See [docs](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/advanced-usage.md#transform-svelte-files-with-vite-plugins) for more information.
