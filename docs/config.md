# Configuration

`vite-plugin-svelte` accepts inline options that can be used to change its behaviour. An object can be passed to the first argument of the `svelte` plugin:

```js
export default defineConfig({
	plugins: [
		svelte({
			/* plugin options */
		})
	]
});
```

Explore the various options below!

## Config file

### Config file resolving

Besides inline options, `vite-plugin-svelte` will also automatically resolve options from a Svelte config file if one exists. The default search paths are:

- `svelte.config.js`
- `svelte.config.mjs`
- `svelte.config.cjs`

To set a specific config file, use the `configFile` inline option. The path can be absolute or relative to the [Vite root](https://vitejs.dev/config/#root). For example:

```js
export default defineConfig({
	plugins: [
		svelte({
			configFile: 'my-svelte.config.js'
		})
	]
});
```

A basic Svelte config looks like this:

```js
// svelte.config.js
export default {
	// config options
};
```

### Config file extension

Depending on Node's mode, make sure you're using the correct extension and syntax so it can be resolved safely.

- If `type: "module"` is defined in `package.json`, using `.js` only allows ESM code. Use `.cjs` to allow CJS code.
- If `type: "module"` is not defined, using `.js` only allows CJS code. Use `.mjs` to allows ESM code.

> Try to stick with the `.js` extension whenever possible.

## Svelte options

These options are specific to the Svelte compiler and are generally shared across many bundler integrations.

<!-- TODO: Also note where these options can be placed in svelte.config.js -->

### compilerOptions

- **Type:** `CompileOptions` - See [svelte.compile](https://svelte.dev/docs#svelte_compile)

  The options to be passed to the Svelte compiler. A few options are set by default, including `dev`, `format` and `css`. However, some options are non-configurable, like `filename`, `generate`, and `cssHash`.

### preprocess

- **Type:** `PreprocessorGroup | PreprocessorGroup[]` - See [svelte.preprocess](https://svelte.dev/docs#svelte_preprocess)

  An array of preprocessors to transform the Svelte source code before compilation.

  **Example:**

  ```js
  import sveltePreprocess from 'svelte-preprocess';

  export default defineConfig({
  	plugins: [
  		svelte({
  			preprocess: [sveltePreprocess({ typescript: true })]
  		})
  	]
  });
  ```

## Plugin options

These options are specific to the Vite plugin itself.

### include

- **Type:** `string | string[]`

A [picomatch pattern](https://github.com/micromatch/picomatch), or array of patterns, which specifies the files the plugin should operate on. By default, all svelte files are included.

### exclude

- **Type:** `string | string[]`

A [picomatch pattern](https://github.com/micromatch/picomatch), or array of patterns, which specifies the files to be ignored by the plugin. By default, no files are ignored.

### extensions

- **Type:** `string[]`
- **Default:** `['.svelte']`

  A list of file extensions to be compiled by Svelte. Useful for custom extensions like `.svg` and `.svx`.

### emitCss

- **Type:** `boolean`
- **Default:** `true`

  Emit Svelte styles as virtual CSS files for Vite and other plugins to process.

### onwarn

- **Type:** `(warning: Warning, defaultHandler?: (warning: Warning) => void) => void` - See [Warning](https://github.com/sveltejs/svelte/blob/ce550adef65a7e04c381b11c24f07a2ae1c25783/src/compiler/interfaces.ts#L121-L130)

  Handles warning emitted from the Svelte compiler. Useful to suppress warning messages.

  **Example:**

  ```js
  export default defineConfig({
  	plugins: [
  		svelte({
  			onwarn(warning, defaultHandler) {
  				// don't warn on <marquee> elements, cos they're cool
  				if (warning.code === 'a11y-distracting-elements') return;

  				// handle all other warnings normally
  				defaultHandler(warning);
  			}
  		})
  	]
  });
  ```

### hot

- **Type:** `boolean | SvelteHotOptions` - See [svelte-hmr](https://github.com/sveltejs/svelte-hmr#options)
- **Default:** `true` for development, always `false` for production

  Enable or disable Hot Module Replacement ([HMR](https://github.com/sveltejs/svelte-hmr#whats-hmr-by-the-way)).

  > Do not customize the options unless you know exactly what you are doing.

### ignorePluginPreprocessors

- **Type:** `boolean | string[]`
- **Default:** `false`

  Some Vite plugins can contribute additional preprocessors by defining [api.sveltePreprocess](./faq.md#how-do-i-add-a-svelte-preprocessor-from-a-vite-plugin). If you don't want to use them, set this to true to ignore them all or use an array of strings with plugin names to specify which.

### disableDependencyReinclusion

- **Type:** `boolean | string[]`
- **Default:** `false`

  `vite-plugin-svelte` automatically manages [pre-bundling for Svelte components](./faq.md#what-is-going-on-with-vite-and-pre-bundling-dependencies). To opt-out of this automatic behavior you can use:

  - `disableDependencyReinclusion: true` to disable all re-inclusions
  - `disableDependencyReinclusion: ['foo']` to disable re-inclusions only for dependencies of `foo`.

  If you want to manually re-include the dependency `bar` of `foo`, you can add `{optimizeDeps:{include:['foo > bar']}}` to your Vite config

  > This is currently required for hybrid packages like Routify, that export both Node and browser code.

## Experimental options

These options are considered experimental and breaking changes to them can occur in any release! Specify them under the `experimental` option.

```js
export default defineConfig({
	plugins: [
		svelte({
			experimental: {
				// experimental options
			}
		})
	]
});
```

### useVitePreprocess

- **Type:** `boolean`
- **Default:** `false`

  Use extra preprocessors that delegate style and TypeScript preprocessing to native Vite plugins. Do not use together with `svelte-preprocess`!

  > Caveat: For TypeScript preprocessing to work, `esbuild.tsconfigRaw.compilerOptions.importsNotUsedAsValues` will be set to `preserve` to safely transpile TypeScript. This requires the entire codebase's Typescript code to only use `import type` when importing types, otherwise the codebase would break.

### generateMissingPreprocessorSourcemaps

- **Type:** `boolean`
- **Default:** `false`

  If a preprocessor does not provide a sourcemap, a best-effort fallback sourcemap will be provided. This option requires [diff-match-patch](https://github.com/google/diff-match-patch) to be installed as a peer dependency.

### dynamicCompileOptions

- **Type:**

  ```ts
  type DynamicCompileOptions = (data: {
  	filename: string; // The file to be compiled
  	code: string; // The preprocessed Svelte code
  	compileOptions: Partial<CompileOptions>; // The current compiler options
  }) => Promise<Partial<CompileOptions> | void> | Partial<CompileOptions> | void;
  ```

  A function to update the `compilerOptions` before compilation. To change part of the compiler options, return an object with the changes you need.

  **Example:**

  ```js
  export default defineConfig({
  	plugins: [
  		svelte({
  			experimental: {
  				dynamicCompileOptions({ filename, compileOptions }) {
  					// Dynamically set hydration per Svelte file
  					if (compileWithHydratable(filename) && !compileOptions.hydratable) {
  						return { hydratable: true };
  					}
  				}
  			}
  		})
  	]
  });
  ```
