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

### Disable automatic handling of Svelte config

Use `configFile: false` to prevent `vite-plugin-svelte` from reading the config file or restarting the Vite dev server when it changes.

```js
export default defineConfig({
  plugins: [
    svelte({
      configFile: false
      // your svelte config here
    })
  ]
});
```

> Warning:
> This option primarily exists for frameworks like SvelteKit that do their own parsing of Svelte config and control the Vite dev server.
> You are responsible to provide the complete inline config when used.

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

  Use extra preprocessors that delegate style and TypeScript preprocessing to native Vite plugins. TypeScript will be transformed with esbuild. Styles will be transformed using [Vite's CSS plugin](https://vitejs.dev/guide/features.html#css), which handles `@imports`, `url()` references, PostCSS, CSS Modules, and `.scss`/`.sass`/`.less`/`.styl`/`.stylus` files. Do not use together with TypeScript or style preprocessors from `svelte-preprocess` as attempts to transform the content twice will fail!

### prebundleSvelteLibraries

- **Type:** `boolean`
- **Default:** `false`

  Force Vite to pre-bundle Svelte libraries. Setting this `true` should improve initial page load performance, especially when using large Svelte libraries. See the [FAQ](./faq.md#what-is-going-on-with-vite-and-pre-bundling-dependencies) for details of the pre-bundling implementation.

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

### inspector

- **Type:**`InspectorOptions | boolean`

  ```ts
  interface InspectorOptions {
    /**
     * define a key combo to toggle inspector,
     * @default 'control-shift' on windows, 'meta-shift' on other os
     *
     * any number of modifiers `control` `shift` `alt` `meta` followed by zero or one regular key, separated by -
     * examples: control-shift, control-o, control-alt-s  meta-x control-meta
     * Some keys have native behavior (e.g. alt-s opens history menu on firefox).
     * To avoid conflicts or accidentally typing into inputs, modifier only combinations are recommended.
     */
    toggleKeyCombo?: string;

    /**
     * inspector is automatically disabled when releasing toggleKeyCombo after holding it for a longpress
     * @default false
     */
    holdMode?: boolean;

    /**
     * when to show the toggle button
     * @default 'active'
     */
    showToggleButton?: 'always' | 'active' | 'never';

    /**
     * where to display the toggle button
     * @default top-right
     */
    toggleButtonPos?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

    /**
     * inject custom styles when inspector is active
     */
    customStyles?: boolean;

    /**
     * append an import to the module id ending with `appendTo` instead of adding a script into body
     * useful for frameworks that do not support trannsformIndexHtml hook
     *
     * WARNING: only set this if you know exactly what it does.
     * Regular users of vite-plugin-svelte or SvelteKit do not need it
     */
    appendTo?: string;
  }
  ```

  Set to `true` or customized `InspectorOptions` to enable svelte inspector during development.

  When enabled, inspector mode shows you the file location where the element under cursor is defined and you can click to quickly open your code editor at this location.
