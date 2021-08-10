---
'@sveltejs/vite-plugin-svelte': major
---

automatically include svelte in vite config optimizeDeps.include

Previously, svelte was automatically excluded. We include it now by default to improve deduplication.

As a result, svelte is pre-bundled by vite during dev, which it logs when starting the devserver

```shell
Pre-bundling dependencies:
  svelte/animate
  svelte/easing
  svelte/internal
  svelte/motion
  svelte/store
  (...and 2 more)
(this will be run only when your dependencies or config have changed)
```

And it's also visible in the browsers network tab, where requests for svelte imports now start with `node_modules/.vite/` during dev.

Check out the [vite pre-bundling documentation](https://vitejs.dev/guide/dep-pre-bundling.html) for more information.

To get the old behavior back, add the following to your vite config

```js
optimizeDeps: {
	exclude: ['svelte'];
}
```
