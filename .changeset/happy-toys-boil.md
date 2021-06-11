---
'@sveltejs/vite-plugin-svelte': major
---

feat: convert to es module with cjs fallback, use named export instead of default

If you are using vite-plugin-svelte with require, you should switch to esm and import the named export "svelte".
An example can be found in the usage section of the [readme](README.md)

For existing esm configs update your import to use the new named export.

```diff
- import svelte from '@sveltejs/vite-plugin-svelte';
+ import { svelte } from '@sveltejs/vite-plugin-svelte';
```

continuing with cjs/require is discouraged but if you must use it, update your require statement to use the named export

```diff
- const svelte = require('@sveltejs/vite-plugin-svelte');
+ const { svelte } = require('@sveltejs/vite-plugin-svelte');
```
