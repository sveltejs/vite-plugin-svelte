---
'@sveltejs/vite-plugin-svelte': major
---

change default value of compilerOptions.hydratable to false

This is done to align with svelte compiler defaults and improve output in non-ssr scenarios.

Add `{compilerOptions: {hydratable: true}}` to vite-plugin-svelte config if you need hydration (eg. for ssr)
