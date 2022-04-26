# @sveltejs/vite-plugin-svelte

[![npm version](https://img.shields.io/npm/v/@sveltejs/vite-plugin-svelte)](https://www.npmjs.com/package/@sveltejs/vite-plugin-svelte)
[![CI](https://github.com/sveltejs/vite-plugin-svelte/actions/workflows/ci.yml/badge.svg)](https://github.com/sveltejs/vite-plugin-svelte/actions/workflows/ci.yml)
[![Chat](https://img.shields.io/discord/457912077277855764?label=chat&logo=discord)](https://svelte.dev/chat)

The official [Svelte](https://svelte.dev) plugin for [Vite](https://vitejs.dev).

## Installation

```bash
npm install --save-dev @sveltejs/vite-plugin-svelte
```

## Usage

```js
// vite.config.js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      /* plugin options */
    })
  ]
});
```

## Documentation

- [Plugin options](./docs/config.md)
- [FAQ](./docs/faq.md)

## Packages

| Package                                                     | Changelog                                             |
| ----------------------------------------------------------- | ----------------------------------------------------- |
| [@sveltejs/vite-plugin-svelte](packages/vite-plugin-svelte) | [Changelog](packages/vite-plugin-svelte/CHANGELOG.md) |

## Got a question? / Need help?

Join the [Svelte Discord server](https://svelte.dev/chat)!

## Development

- Run `pnpm i` to install dependencies
- Run `pnpm dev` in `packages/vite-plugin-svelte` to autobuild plugin
- Run `pnpm dev` in `packages/playground/xxx` to start a Vite app

Note that changes in the plugin needs restart of the Vite dev server.

## Credits

- [Svelte](https://svelte.dev) and [Vite](https://github.com/vitejs/vite#readme) creators, maintainers and contributors
- [rixo](https://github.com/rixo) - without svelte-hmr and your support this would not have been possible
- [intrnl](https://github.com/intrnl) - initial inspiration from https://github.com/intrnl/vite-plugin-svelte

## License

[MIT](./LICENSE)
