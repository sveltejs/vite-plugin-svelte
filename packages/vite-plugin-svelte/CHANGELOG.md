# @sveltejs/vite-plugin-svelte

## 1.0.0-next.11

### Major Changes

- [#54](https://github.com/sveltejs/vite-plugin-svelte/pull/54) [`0f7e256`](https://github.com/sveltejs/vite-plugin-svelte/commit/0f7e256a9ebb0ee9ac6075146d27bf4f11ecdab3) feat: convert to es module with cjs fallback, use named export instead of default

  If you are using vite-plugin-svelte with require, you should switch to esm and import the named export "svelte".
  An example can be found in the usage section of the [readme](README.md)

  For existing esm configs update your import to use the new named export.

  ```diff
  - import svelte from '@sveltejs/vite-plugin-svelte';
  + import { svelte } from '@sveltejs/vite-plugin-svelte';
  ```

  continuing with cjs/require is discouraged but if you must use it, update your require statement to use the named export

  ```diff
  - const svelte = require('@sveltejs/vite-plugin-svelte');
  + const { svelte } = require('@sveltejs/vite-plugin-svelte');
  ```

### Minor Changes

- [#45](https://github.com/sveltejs/vite-plugin-svelte/pull/45) [`673cf61`](https://github.com/sveltejs/vite-plugin-svelte/commit/673cf61b3800e7a64be2b73a7273909da95729d2) Feature: log svelte compiler warnings to console. use options.onwarn to customize logging

### Patch Changes

- [#44](https://github.com/sveltejs/vite-plugin-svelte/pull/44) [`24ae093`](https://github.com/sveltejs/vite-plugin-svelte/commit/24ae0934301cb50506bf39cdccc07ad3eac546fd) update to esbuild 0.12 and vite 2.3.7

* [#44](https://github.com/sveltejs/vite-plugin-svelte/pull/44) [`24ae093`](https://github.com/sveltejs/vite-plugin-svelte/commit/24ae0934301cb50506bf39cdccc07ad3eac546fd) update engines.node to "^12.20 || ^14.13.1 || >= 16"

- [#45](https://github.com/sveltejs/vite-plugin-svelte/pull/45) [`673cf61`](https://github.com/sveltejs/vite-plugin-svelte/commit/673cf61b3800e7a64be2b73a7273909da95729d2) enable logging for compiler warnings

## 1.0.0-next.10

### Minor Changes

- [#41](https://github.com/sveltejs/vite-plugin-svelte/pull/41) [`cb7f03d`](https://github.com/sveltejs/vite-plugin-svelte/commit/cb7f03d61c19f0b98c6412c11bbaa4af978da9ed) Feature: Allow `emitCss: false` for production builds and customizable compilerOptions.css and hydratable - fixes #9

## 1.0.0-next.9

### Patch Changes

- [#38](https://github.com/sveltejs/vite-plugin-svelte/pull/38) [`5aef91c`](https://github.com/sveltejs/vite-plugin-svelte/commit/5aef91c8752c8de94a1f1fcb28618606b7c44670) fix: ensure esm config loading works on windows

## 1.0.0-next.8

### Minor Changes

- [#35](https://github.com/sveltejs/vite-plugin-svelte/pull/35) [`4018ce6`](https://github.com/sveltejs/vite-plugin-svelte/commit/4018ce621b4df75877e0e18057c332f27158d42b) Feature: Support esm in svelte.config.js and svelte.config.mjs

* [#35](https://github.com/sveltejs/vite-plugin-svelte/pull/35) [`4018ce6`](https://github.com/sveltejs/vite-plugin-svelte/commit/4018ce621b4df75877e0e18057c332f27158d42b) Feature: add configFile option

### Patch Changes

- [#34](https://github.com/sveltejs/vite-plugin-svelte/pull/34) [`e5d4749`](https://github.com/sveltejs/vite-plugin-svelte/commit/e5d4749c0850260a295daab9cb15866fe58ee709) fix: watch preprocessor dependencies and trigger hmr on change

## 1.0.0-next.7

### Minor Changes

- [#32](https://github.com/sveltejs/vite-plugin-svelte/pull/32) [`113bb7d`](https://github.com/sveltejs/vite-plugin-svelte/commit/113bb7dc330a7517085d12d1d0758a376a12253f) Reduced cache usage, share css cache between SSR and client

## 1.0.0-next.6

### Minor Changes

- 1be46f1: improved css hmr
- a0f5a65: Allow other vite plugins to define preprocessors

### Patch Changes

- 8d9ef96: fix: do not preserve types unless useVitePreprocess option is true
- 6f4a253: disable svelte-hmr overlay by default
- 18647aa: improve virtual css module path (fixes #14)

## 1.0.0-next.5

### Patch Changes

- 61439ae: initial release
