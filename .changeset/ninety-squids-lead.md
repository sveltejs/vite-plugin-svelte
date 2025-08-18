---
'@sveltejs/vite-plugin-svelte': patch
---

fix(api): add `api.filter` and deprecate `api.idFilter` to avoid confusing `filter.id = idFilter.id` assignments when used as hybrid filter in other plugins
