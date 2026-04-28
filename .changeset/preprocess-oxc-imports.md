---

## '@sveltejs/vite-plugin-svelte': patch

Pass `typescript.onlyRemoveTypeImports` to `transformWithOxc` in `vitePreprocess` so value imports are not dropped when they are only referenced in Svelte template markup ([1313](https://github.com/sveltejs/vite-plugin-svelte/issues/1313)).
