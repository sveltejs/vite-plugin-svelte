# @sveltejs/vite-plugin-svelte

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
