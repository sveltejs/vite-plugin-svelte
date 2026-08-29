---
'@sveltejs/vite-plugin-svelte': patch
---

fix: inject the inspector into the client under Vite+ on pnpm, where the realpathed client module has no `vite/` segment before `dist/`
