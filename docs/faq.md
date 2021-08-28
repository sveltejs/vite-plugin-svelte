# Frequently Asked Questions

### Why is component state reset on HMR update?

Preservation of local component state after JS updates is disabled to avoid unpredictable and error-prone behavior. You can read more about it [here](https://github.com/rixo/svelte-hmr#preservation-of-local-state).

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

For reference, check out [windicss](https://github.com/windicss/vite-plugin-windicss/blob/517eca0cebc879d931c6578a08accadfb112157c/packages/vite-plugin-windicss/src/index.ts#L167)!
