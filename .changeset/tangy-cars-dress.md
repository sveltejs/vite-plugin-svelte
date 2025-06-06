---
'@sveltejs/vite-plugin-svelte': major
---

define filters using object hook syntax and optimize the filter for resolveId

> [!NOTE]
> include logic has changed to files matching `svelteConfig.include` **OR** `svelteConfig.extensions`. Previously only files matching both were loaded and transformed.
