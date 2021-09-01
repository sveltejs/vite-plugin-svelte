---
'@sveltejs/vite-plugin-svelte': patch
---

Improve automatic dependency pre-bundling by not reincluding dependencies that are already present in optimizeDeps.exclude
