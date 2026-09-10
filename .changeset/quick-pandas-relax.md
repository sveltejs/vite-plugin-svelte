---
'@sveltejs/vite-plugin-svelte': patch
---

fix: normalize paths consistently in `DependenciesCache` so style preprocessor dependencies (e.g. postcss `@import`/global-data files) correctly trigger HMR on Windows
