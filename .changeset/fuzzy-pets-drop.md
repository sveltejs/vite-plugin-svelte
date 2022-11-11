---
'@sveltejs/vite-plugin-svelte': patch
---

when prebundleSvelteLibraries is true and a dependency is manually excluded, generate reincludes for it's cjs deps
