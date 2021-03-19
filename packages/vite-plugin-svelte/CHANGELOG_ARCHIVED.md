# archived changelog

This is the archived changelog of @svitejs/vite-plugin-svelte before it was renamed to @sveltejs/vite-plugin-svelte

## [0.11.1](https://github.com/sveltejs/vite-plugin-svelte/compare/vite-plugin-svelte@0.11.0...vite-plugin-svelte@0.11.1) (2021-03-15)

### Bug Fixes

- update svelte-hmr options interface and add warning to leave it at defaults ([c0f0a17](https://github.com/sveltejs/vite-plugin-svelte/commit/c0f0a1704275c776e6f40fdcdeb35c76f9c11d43))

# [0.11.0](https://github.com/sveltejs/vite-plugin-svelte/compare/vite-plugin-svelte@0.10.0...vite-plugin-svelte@0.11.0) (2021-03-13)

### Features

- **vite-plugin-svelte:** automatic default options ([#10](https://github.com/svitejs/svite/issues/10)) ([dbc0a98](https://github.com/sveltejs/vite-plugin-svelte/commit/dbc0a98bbfcac79320f8da68f395acb74c3bed44))
- **vite-plugin-svelte:** experimental option to use vite transforms as svelte preprocessor ([#9](https://github.com/svitejs/svite/issues/9)) ([01dad3f](https://github.com/sveltejs/vite-plugin-svelte/commit/01dad3f4a9148cd65bbac306219b560d5f2860be))
- **vite-plugin-svelte:** improve css hmr by ignoring js updates that do not change runtime result ([4aeff87](https://github.com/sveltejs/vite-plugin-svelte/commit/4aeff879b0f0dcb9e143ff019bee7cb66f67fe24))

# [0.10.0](https://github.com/sveltejs/vite-plugin-svelte/compare/vite-plugin-svelte@0.10.0-0...vite-plugin-svelte@0.10.0) (2021-03-08)

### Bug Fixes

- **vite-plugin-svelte:** vite resolve.mainFields is not merged, so we need to return the whole list ([c22f28a](https://github.com/sveltejs/vite-plugin-svelte/commit/c22f28ad38016810e1a4d7ccf165e81d977eed3c))

# [0.10.0-0](https://github.com/sveltejs/vite-plugin-svelte/compare/vite-plugin-svelte@0.9.4...vite-plugin-svelte@0.10.0-0) (2021-03-06)

### Features

- **vite-plugin-svelte:** add pnpm compatibility and implement auto hot on dev serve ([#3](https://github.com/svitejs/svite/issues/3)) ([ab7f463](https://github.com/sveltejs/vite-plugin-svelte/commit/ab7f463c83abf68e8ca88497549e30a721296c7b))

## [0.9.4](https://github.com/sveltejs/vite-plugin-svelte/compare/vite-plugin-svelte@0.9.3...vite-plugin-svelte@0.9.4) (2021-03-05)

### Bug Fixes

- **vite-plugin-svelte:** relative-resolve for svelte-hmr runtime ([4a04456](https://github.com/sveltejs/vite-plugin-svelte/commit/4a044568d23aae0fbb5eb1834bf61a33d986093f))

## [0.9.3](https://github.com/sveltejs/vite-plugin-svelte/compare/vite-plugin-svelte@0.9.2...vite-plugin-svelte@0.9.3) (2021-03-02)

### Features

- **vite-plugin-svelte:** exclude svelte from optimizeDeps again to prevent 2 svelte instances issue ([8f137f1](https://github.com/sveltejs/vite-plugin-svelte/commit/8f137f1919ae39592ac6ebfe7f6c93c6e83c988a))

## [0.9.2](https://github.com/sveltejs/vite-plugin-svelte/compare/vite-plugin-svelte@0.9.1...vite-plugin-svelte@0.9.2) (2021-03-01)

### Bug Fixes

- **vite-plugin-svelte:** add missing return to set csshash on first apply ([d5efc42](https://github.com/sveltejs/vite-plugin-svelte/commit/d5efc4212e2e3437d061069ec8764460f4a2ce81))

## [0.9.1](https://github.com/sveltejs/vite-plugin-svelte/compare/vite-plugin-svelte@0.9.0...vite-plugin-svelte@0.9.1) (2021-02-28)

### Bug Fixes

- **vite-plugin-svelte:** declare debug as dependency ([9312edd](https://github.com/sveltejs/vite-plugin-svelte/commit/9312eddd158a2ed5cf098fd331b2c92df26a6b09))

# [0.9.0](https://github.com/sveltejs/vite-plugin-svelte/compare/vite-plugin-svelte@0.9.0-2...vite-plugin-svelte@0.9.0) (2021-02-28)

### Bug Fixes

- **vite-plugin-svelte:** do not bundle dependencies ([2962044](https://github.com/sveltejs/vite-plugin-svelte/commit/2962044eddf23c22af25dd21e917116143de5b88))

### Features

- **vite-plugin-svelte:** improved caching, add option to disable cache for transforms ([9226049](https://github.com/sveltejs/vite-plugin-svelte/commit/92260495b28f4edf277b7aa386be6b33828bd9f8))
- **vite-plugin-svelte:** optimize svelte dependencies ([6af65ca](https://github.com/sveltejs/vite-plugin-svelte/commit/6af65cab5af555536d89e30b3cf0f4929e39688f))

# [0.9.0-2](https://github.com/sveltejs/vite-plugin-svelte/compare/vite-plugin-svelte@0.9.0-1...vite-plugin-svelte@0.9.0-2) (2021-02-26)

### Bug Fixes

- **vite-plugin-svelte:** use same css hash for ssr ([4d2cc1f](https://github.com/sveltejs/vite-plugin-svelte/commit/4d2cc1ff589c40bc15a41e454c657d6cfc23fd26))

### Features

- **vite-plugin-svelte:** new options for css hmr and ssr ([6fa1ecb](https://github.com/sveltejs/vite-plugin-svelte/commit/6fa1ecb85eee93f1356ae941312d5582122e6b71))

# [0.9.0-1](https://github.com/sveltejs/vite-plugin-svelte/compare/vite-plugin-svelte@0.9.0-0...vite-plugin-svelte@0.9.0-1) (2021-02-23)

### Bug Fixes

- svelte css class capture regex ([ab6cc1b](https://github.com/sveltejs/vite-plugin-svelte/commit/ab6cc1b39bb308e7abcdef139ad345006a3ca3ec))

# 0.9.0-0 (2021-02-21)

- Initial release
