---
'@sveltejs/vite-plugin-svelte': minor
---

feat: dispatch a `svelte-inspector:pick` event on `window` when the inspector opens an element, and mark the inspector's components with `Symbol.for('svelte.devtools.ignore')` so devtools can leave them out
