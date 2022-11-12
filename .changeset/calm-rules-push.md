---
'@sveltejs/vite-plugin-svelte': minor
---

enable `prebundleSvelteLibraries` by default to improve page loading for the dev server.

If you are using deep imports for svelte libraries that are now prebundled, update your imports to use the package index instead.

```diff
- import SomeComponent from 'some-library/src/SomeComponent.svelte'
+ import {SomeComponent} from 'some-library'
```

see [FAQ](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md#what-is-going-on-with-vite-and-pre-bundling-dependencies) for more information about prebundleSvelteLibraries and how to tune it.
