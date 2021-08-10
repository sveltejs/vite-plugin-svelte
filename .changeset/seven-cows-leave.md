---
'@sveltejs/vite-plugin-svelte': major
---

automatically include svelte in vite config optimizeDeps.include

Previously, svelte was automatically excluded. We include it now to improve deduplication

To get the old behavior back, add the following to your vite config

```js
optimizeDeps: {
	exclude: ['svelte'];
}
```
