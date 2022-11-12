# Frequently Asked Questions

### Why is component state reset on HMR update?

Preservation of local component state after JS updates is disabled to avoid unpredictable and error-prone behavior. You can read more about it [here](https://github.com/sveltejs/svelte-hmr/blob/master/packages/svelte-hmr#preservation-of-local-state).

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

If you are building a Vite plugin that transforms CSS or JS, you can add a `api.sveltePreprocess: PreprocessorGroup` to your Vite plugin definition and it will be added to the list of Svelte preprocessors used at runtime.

```js
const vitePluginCoolCss = {
  name: 'vite-plugin-coolcss',
  api: {
    sveltePreprocess: {
      /* your PreprocessorGroup here */
    }
  }
  /*... your cool css plugin implementation here .. */
};
```

For reference, check out [windicss](https://github.com/windicss/vite-plugin-windicss/blob/517eca0cebc879d931c6578a08accadfb112157c/packages/vite-plugin-windicss/src/index.ts#L167).

### What is going on with Vite and `Pre-bundling dependencies:`?

Pre-bundling dependencies is an [optimization in Vite](https://vitejs.dev/guide/dep-pre-bundling.html).

It is required for CJS dependencies, as Vite's development server only works with ES modules on the client side.
Importantly for Svelte libraries and ESM modules, prebundling combines component libraries into a single file to speed up the initial page load.

For prebundled svelte libraries it is recommended that you do not use deep imports.

```diff
- import SomeComponent from 'some-library/src/SomeComponent.svelte'
+ import {SomeComponent} from 'some-library'
```

For huge libraries where you only import a few components this can lead to slower first start, as all components have to be compiled once, even if you never use them.
It also slows down re-prebundling, which can happen when vite discovers new dependencies or you change your svelte config.

In that case, add these huge libraries to optimizeDeps.exclude and use deep imports to import the components you need.

e.g.

```js
// vite.config.js
export default defineConfig({
  optimizeDeps: {
    exclude: ['svelte-2000-icons'] // do not pre-bundle svelte-2000-icons
  }
});
```

```html
<!-- src/.../SomeSvelte.svelte -->
<script>
  // use deep import to avoid loading all components of svelte-2000-icons in the browser
  import OneIcon from 'svelte-2000-icons/src/icons/OneIcon.svelte';
</script>
<OneIcon />
```
