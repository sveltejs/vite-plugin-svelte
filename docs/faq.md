# Frequently Asked Questions

### Something is wrong with my config, how can I find where the problem comes from?

`vite` and `vite-plugin-svelte` can be made more verbose by using the debug mode:

- `export DEBUG=vite-plugin-svelte:config ; vite`: log `vite-plugin-svelte` debug info related to the config
- `export DEBUG=vite-plugin-svelte:* ; vite`: log all `vite-plugin-svelte` debug info
- `export DEBUG=* ; vite`: log all debug info

### Why is component state reset on HMR update?

Preservation of local component state after JS updates is disabled to avoid unpredictable and error-prone behavior.
Since svelte-5, hmr is integrated in compileOptions, but the sentiment in the previously used [svelte-hmr docs](https://github.com/sveltejs/svelte-hmr/blob/master/packages/svelte-hmr#preservation-of-local-state) still applies.

Please note that if you only edit the `<style>` node, a separate CSS update can be applied where component state is 100% preserved.

### What is the recommended node order for Svelte SFC files?

The `<style>` node should be last to ensure optimal HMR results. This is also the default order with [prettier-plugin-svelte](https://github.com/sveltejs/prettier-plugin-svelte).

Good:

```html
<script></script>
<div></div>
<style></style>
```

Bad:

```html
<script></script>
<style></style>
<!-- this template element is below the style node and may cause extra HMR updates -->
<div></div>
```

### Why isn't Vite detecting my imports correctly in `.svelte` files with TypeScript?

You have to use the `lang="ts"` attribute for Vite to parse it. Never `lang="typescript"` or `type="text/typescript"`.

Good:

```html
<script lang="ts"></script>
```

Bad:

```html
<!-- These are not detected by Vite -->
<script lang="typescript"></script>
<script type="text/typescript"></script>
```

### Where should I put my global styles?

Global styles should always be placed in their own stylesheet files whenever possible, and not in a Svelte component's `<style>` tag. The stylesheet files can then be imported directly in JS and take advantage of Vite's own style processing. It would also significantly improve the dev server startup time.

Good:

```scss
/* global.scss */
html {
  color: $text-color;
}
```

```js
// main.js
import './global.scss';
```

Bad:

```svelte
<style lang="scss">
  :global(html) {
    color: $text-color;
  }
</style>
```

### Why can't `cssHash` be set in development mode?

`cssHash` is fixed in development for CSS HMR in Svelte components, ensuring that the hash value is stable based on the file name so that styles are only updated when changed.

However, `cssHash` is respected in production builds as HMR is a dev-only feature.

### How do I add a Svelte preprocessor from a Vite plugin?

You don't have to anymore. See [advanced usage](advanced-usage.md) for examples how to put transform hooks before or after Svelte preprocess or compile

### What is going on with Vite and `Pre-bundling dependencies:`?

Prebundling dependencies is an [optimization in Vite](https://vitejs.dev/guide/dep-pre-bundling.html).

> We only use prebundling during **development**, the following does not apply to or describe the built application

It is required for CJS dependencies, as Vite's development server only works with ES modules on the client side.
Importantly for Svelte libraries and ES modules, it also reduces the number of http requests when you load a page from the dev server and caches files so subsequent starts are even faster.

The way prebundling Svelte libraries affects your dev-server load times depends on the import style you use, index or deep:

#### Index imports

Offers better DX but can cause noticable delays on your machine, especially for libraries with many files.

```diff
import { SomeComponent } from 'some-library'
+ only one request per library
+ intellisense for the whole library after first import
- compiles the whole library even if you only use a few components
- slower build and dev-server ssr
```

#### Deep imports

Offers snappier dev and faster builds for libraries with many files at the expense of some DX

```diff
import SomeComponent from 'some-library/src/SomeComponent.svelte'
+ compiles only the components you import
+ faster build and dev-server ssr
- one request per import can slow down initial load if you use a lot of components
- intellisense only for imported components
```

#### Rewriting imports with plugins or preprocessors

**Do not use it in combination with prebundling!**

Prebundling works by reading your `.svelte` files from disk and scanning them for imports. It cannot detect
added/changed/removed imports and these then cause extra requests, delays and render the prebundled files from the initial scan moot.
If you prefer to use these tools, please exclude the libraries you use them with from prebundling.

#### Excluding libraries from prebundling

If you want to disable prebundling for a single library, use `optimizeDeps.exclude`

```js
// vite.config.js
export default defineConfig({
  optimizeDeps: {
    exclude: ['some-library'] // do not pre-bundle some-library
  }
});
```

Or disable it for all Svelte libraries

```js
// svelte.config.js
export default {
  vitePlugin: {
    prebundleSvelteLibraries: false
  }
};
```

#### Recommendations

There is no golden rule, but you can follow these recommendations:

1. **Never** combine plugins or preprocessors that rewrite imports with prebundling
2. Start with index imports and if your dev-server or build process feels slow, run the process with `DEBUG="vite-plugin-svelte:stats"` to check compile stats to see if switching to deep imports can improve the experience.
3. Do not mix deep and index imports for the same library, use one style consistently.
4. Use different import styles for different libraries where it helps. E.g. deep imports for the few icons of that one huge icon library, but index import for the component library that is heavily used.

#### I get a warning `Incompatible options: prebundleSvelteLibraries ...`

This warning only occurs if you use non-default settings in your vite config that can cause problems in combination with prebundleSvelteLibraries.
You should not use prebundleSvelteLibraries during build or for ssr, disable one of the incompatible options to make that warning (and subsequent errors) go away.

### how can I use vite-plugin-svelte from commonjs

You really shouldn't. Svelte and Vite are esm first and the ecosystem is moving away from commonjs and so should you. Consider migrating to esm.

In case you have to, you can rely on node's "require esm" feature available in v20.19+

```js
// vite.config.cjs
const { defineConfig } = require('vite');
const { svelte, vitePreprocess } = require('@sveltejs/vite-plugin-svelte');

module.exports = defineConfig({
  plugins: [svelte({ preprocess: vitePreprocess() })]
});
```

<!-- the following header generates an anchor that is used in logging, do not modify!-->

### missing exports condition

> If you see a warning logged for this when using a Svelte library, please tell the library maintainers.

Using the `svelte` field in `package.json` to point at `.svelte` source files is **deprecated** and you must use a `svelte` [export condition](https://nodejs.org/api/packages.html#conditional-exports).
vite-plugin-svelte 3 still resolves it as a fallback, but in a future major release this is going to be removed and without exports condition resolving the library is going to fail.

Example:

```diff
// package.json
  "files": ["dist"],
  "svelte": "dist/index.js",
+ "exports": {
+   ".": {
+     "svelte": "./dist/index.js"
+   }
  }
```

You can also add individual exports of .svelte files in the exports map which gives users a choice to also use deep imports.
See the faq about [vite and prebundling](#what-is-going-on-with-vite-and-pre-bundling-dependencies) why they can be useful at times.

> Library authors are highly encouraged to update their packages to add the new exports condition as outlined above. Check out
> [svelte-package](https://kit.svelte.dev/docs/packaging) which already supports it.
>
> For backwards compatibility, you can keep the `svelte` field in addition to the `exports` condition. But make sure that both always resolve to the same files.

### How can I use relative paths for asset references in svelte components like `<img src="./asset.png">`

This is not supported out of the box. To resolve assets, you have to either import them like this:

```html
<script>
  import assetUrl from './asset.png';
</script>
<img src="{assetUrl}" />
```

or use a separate tool to add this functionality.
The 2 recommended solutions are [sveltejs/enhanced-img](https://kit.svelte.dev/docs/images#sveltejs-enhanced-img) (only for image elements) and [svelte-preprocess-import-assets](https://www.npmjs.com/package/svelte-preprocess-import-assets) (for all asset URLs).
