---
'@sveltejs/vite-plugin-svelte': minor
---

Add `experimental` section to options and move `useVitePreprocess` there

Experimental options are not ready for production use and breaking changes to them can occur in any release

If you already had `useVitePreprocess` enabled, update you config:

```diff
- svelte({useVitePreprocess: true})
+ svelte({experimental: {useVitePreprocess: true}})
```
