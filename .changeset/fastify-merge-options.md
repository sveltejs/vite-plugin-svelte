---
'@sveltejs/vite-plugin-svelte': minor
---

Replace deepmerge with @fastify/deepmerge for option merging. Preserve array replacement and enumerable symbol metadata. Reserved keys `__proto__`, `constructor`, and `prototype` are omitted from merged options.
