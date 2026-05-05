---
'@sveltejs/vite-plugin-svelte': patch
---

fix: pass `typescript.onlyRemoveTypeImports` to `transformWithOxc` in `vitePreprocess` so that value imports are not dropped when they are only referenced in Svelte template markup
