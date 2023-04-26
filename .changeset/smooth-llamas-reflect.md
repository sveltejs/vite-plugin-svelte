---
'@sveltejs/vite-plugin-svelte': minor
---

Remove internal SvelteKit specific handling

- Disallow `kit` prop in inline options
- Remove default `hydratable: true` option for SvelteKit
- Inspector code mounts on `/@vite/client` to be framework agnostic
