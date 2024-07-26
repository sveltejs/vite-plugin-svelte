---
'@sveltejs/vite-plugin-svelte': patch
---

fix(dev): make sure custom cssHash is applied consistently even for prebundled components to avoid hash mismatches during hydration
