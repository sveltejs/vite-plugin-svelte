---
'@sveltejs/vite-plugin-svelte': minor
---

feat(inspector): add a wrapper-chain dropdown (alt-c) to jump to where a component is used

While the inspector is active, `alt-c` enters "chain mode": clicking a node opens a dropdown of its wrapper chain — every ancestor `<Component>` with its exact `file:line` call site (walked from Svelte dev's `__svelte_meta.parent`). Hovering a row outlines that component's DOM; clicking opens it via the same `/__open-in-editor` call. `alt-x` keeps its original single-element behavior.
