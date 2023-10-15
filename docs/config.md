# Configuration

`vite-plugin-svelte` accepts inline options that can be used to change its behaviour. An object can be passed to the first argument of the `svelte` plugin:

```js
// vite.config.js
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

Besides inline options in Vite config, `vite-plugin-svelte` will also automatically resolve options from a Svelte config file if one exists. The default search paths are:

- `svelte.config.js`
- `svelte.config.mjs`
- `svelte.config.cjs`

To set a specific config file, use the `configFile` inline option. The path can be absolute or relative to the [Vite root](https://vitejs.dev/config/#root). For example:

```js
// vite.config.js
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
  // svelte options
  extensions: ['.svelte'],
  compilerOptions: {},
  preprocess: [],
  onwarn: (warning, handler) => handler(warning),
  // plugin options
  vitePlugin: {
    exclude: [],
    // experimental options
    experimental: {}
  }
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
// vite.config.js
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

### compilerOptions

- **Type:** `CompileOptions` - See [svelte.compile](https://svelte.dev/docs#compile-time-svelte-compile)

  The options to be passed to the Svelte compiler. A few options are set by default, including `dev` and `css`. However, some options are non-configurable, like `filename`, `format`, `generate`, and `cssHash` ([in dev](./faq.md#why-cant-csshash-be-set-in-development-mode)).

### preprocess

- **Type:** `PreprocessorGroup | PreprocessorGroup[]` - See [svelte.preprocess](https://svelte.dev/docs#compile-time-svelte-preprocess)

  An array of preprocessors to transform the Svelte source code before compilation.

  **Example:**

  ```js
  // vite.config.js
  import sveltePreprocess from 'svelte-preprocess';

  export default defineConfig({
    plugins: [
      svelte({
        preprocess: [sveltePreprocess({ typescript: true })]
      })
    ]
  });
  ```

### extensions

- **Type:** `string[]`
- **Default:** `['.svelte']`

  A list of file extensions to be compiled by Svelte. Useful for custom extensions like `.svg` and `.svx`.

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

## Plugin options

These options are specific to the Vite plugin itself.

### include

- **Type:** `string | string[]`

A [picomatch pattern](https://github.com/micromatch/picomatch), or array of patterns, which specifies the files the plugin should operate on. By default, all svelte files are included.

### exclude

- **Type:** `string | string[]`

A [picomatch pattern](https://github.com/micromatch/picomatch), or array of patterns, which specifies the files to be ignored by the plugin. By default, no files are ignored.

### emitCss

- **Type:** `boolean`
- **Default:** `true`

  Emit Svelte styles as virtual CSS files for Vite and other plugins to process.

### hot

- **Type:** `boolean | SvelteHotOptions` - See [svelte-hmr](https://github.com/sveltejs/svelte-hmr/blob/master/packages/svelte-hmr#options)
- **Default:** `true` for development, always `false` for production

  Enable or disable Hot Module Replacement ([HMR](https://github.com/sveltejs/svelte-hmr/blob/master/packages/svelte-hmr#whats-hmr-by-the-way)).

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

### prebundleSvelteLibraries

- **Type:** `boolean`
- **Default:** `true` for dev, `false` for build

  Enable [Vite's dependency prebundling](https://vitejs.dev/guide/dep-pre-bundling.html) for Svelte libraries.

  This option improves page loading for the dev server in most applications when using Svelte component libraries.

  See the [FAQ](./faq.md#what-is-going-on-with-vite-and-pre-bundling-dependencies) for details and how to fine-tune it for huge libraries.

### inspector

- **Type:** `InspectorOptions | boolean`
- **Default:** `unset` for dev, always `false` for build

  Set to `true` or options object to enable svelte inspector during development. See the [inspector docs](./inspector.md) for the full configuration options.

  Inspector mode shows you the file location where the element under cursor is defined and you can click to quickly open your code editor at this location.

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
  // vite.config.js
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

## Experimental options

These options are considered experimental and breaking changes to them can occur in any release! Specify them under the `experimental` option.

Either in Vite config:

```js
// vite.config.js
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

or in Svelte config:

```js
// svelte.config.js
export default {
  vitePlugin: {
    experimental: {
      // experimental options
    }
  }
};
```

### sendWarningsToBrowser

- **Type:** `boolean`
- **Default:** `false`

  Sends a websocket message `svelte:warnings` with the warnings that are passed to `onwarn`. This is only useful if you build a custom browser based integration where you want to display these.

  **Example**

  ```js
  import.meta.hot.on('svelte:warnings', (message) => {
    // handle warnings message, eg log to console
    console.warn(`Warnings for ${message.filename}`, message.warnings);
  });
  ```

  **Message format**

  ```ts
  type SvelteWarningsMessage = {
    id: string;
    filename: string;
    normalizedFilename: string;
    timestamp: number;
    warnings: Warning[]; // allWarnings filtered by warnings where onwarn did not call the default handler
    allWarnings: Warning[]; // includes warnings filtered by onwarn and our extra vite plugin svelte warnings
    rawWarnings: Warning[]; // raw compiler output
  };
  ```

### disableSvelteResolveWarnings

- **Type** `boolean`
- **Default:** `false`

  disable svelte resolve warnings. Note: this is highly discouraged and you should instead fix these packages which will break in the future.
