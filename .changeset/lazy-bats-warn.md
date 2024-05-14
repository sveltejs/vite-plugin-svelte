---
'@sveltejs/vite-plugin-svelte': minor
---

allow infix notation for svelte modules

Previously, only suffix notation `.svelte.js` was allowed, now you can also use `.svelte.test.js` or `.svelte.stories.js`.
This helps when writing testcases or other auxillary code where you may want to use runes too.
