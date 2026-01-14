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
- [Svelte Inspector](./docs/inspector.md)
- [FAQ](./docs/faq.md)

## Packages

| Package                                                     | Changelog                                             |
| ----------------------------------------------------------- | ----------------------------------------------------- |
| [@sveltejs/vite-plugin-svelte](packages/vite-plugin-svelte) | [Changelog](packages/vite-plugin-svelte/CHANGELOG.md) |

## Got a question? / Need help?

Join the [Svelte Discord server](https://svelte.dev/chat)!

## Development

All scripts work from monorepo-root.
The plugins are unbundled esm, a build step is not required while developing locally, but restarting local dev-servers can be needed to apply changes.

- `pnpm i` to install dependencies
- `pnpm playwright install chromium` to install required playwright browser binaries via local playwright-core

  > **NOTE**
  > This repo uses `playwright-core` with a bin alias to `playwright` via package.json script
  > Calling `pnpm dlx playwright install chromium` will not work.

- `pnpm check` and `pnpm:test` to validate changes
- `pnpm format` to format source code
- `pnpm test:unit`, `pnpm test:serve` or `pnpm test:build` to run a subset of tests
- `pnpm test <e2e-directory-name>` to focus a specific testsuite
- `pnpm changeset` to generate a changeset
- `pnpm generate:types` to generate public types from jsdoc (this is required when changing types and validated in ci)

## Credits

- [Svelte](https://svelte.dev) and [Vite](https://github.com/vitejs/vite#readme) creators, maintainers and contributors
- [rixo](https://github.com/rixo) - without svelte-hmr and your support this would not have been possible
- [intrnl](https://github.com/intrnl) - initial inspiration from https://github.com/intrnl/vite-plugin-svelte

## License

[MIT](./LICENSE)
