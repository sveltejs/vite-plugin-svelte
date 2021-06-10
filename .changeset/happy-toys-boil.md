---
'@sveltejs/vite-plugin-svelte': major
---

feat: convert to es module and provide cjs fallback

If you are using vite-plugin-svelte with require, you should switch to esm and import the named export "svelte".
An example can be found in the usage section of the [readme](README.md)

continuing with cjs/require is discouraged but if you must use it, update your require statement to use the named export

```diff
- const svelte = require('@sveltejs/vite-plugin-svelte');
+ const { svelte } = require('@sveltejs/vite-plugin-svelte');
```
