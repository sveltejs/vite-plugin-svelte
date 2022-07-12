---
'@sveltejs/vite-plugin-svelte': major
---

move plugin options in svelte.config.js into "vitePlugin"

update your svelte.config.js and wrap [plugin options](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md#plugin-options) with `vitePlugin`

```diff
// svelte.config.js

  compilerOptions:{...},
  preprocess:{...},
  extensions:[...],
  kit:{},
+ vitePlugin: {
   // include, exclude, emitCss, onwarn, hot, ignorePluginPreprocessors, disableDependencyReinclusion, experimental
+ }
```
