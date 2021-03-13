<h1><img width=24 alt="svite-logo" src="resources/svite-logo.svg" style="vertical-align: middle">&nbsp;svite&nbsp;<img width=24 alt="svite-logo" src="resources/svite-logo.svg" style="vertical-align: middle"></h1>

A fresh start for svite based on vite2 repo structure and setup

## Packages

| Package                                                    | Version (click for changelogs)                                                                                                            |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [svite](packages/svite)                                    | [![vite version](https://img.shields.io/npm/v/svite.svg?label=%20)](packages/svite/CHANGELOG.md)                                          |
| [@svitejs/vite-plugin-svelte](packages/vite-plugin-svelte) | [![plugin-vue version](https://img.shields.io/npm/v/@svitejs/vite-plugin-svelte.svg?label=%20)](packages/vite-plugin-svelte/CHANGELOG.md) |

## Development

### dev

- run `pnpm i`to install
- run `pnpm dev` in `packages/vite-plugin-svelte` to autobuild plugin
- run `pnpm dev` in `packages/playground/xxx` to start vite

changes in plugin need restart of dev server

### some notes

- For typescript, svelte components must use `<script lang="ts">`, not `<script lang="typescript">` otherwise vite dep scan fails. see https://discord.com/channels/804011606160703521/804062134051930222/806300072349270033
- exclusions in optimizeDeps also cover children (x or startswith x+/)
- svelte components should be sorted with style nodes last as js code may contain markup node positions

# Got a question? / Need help?

Join [svite discord](https://discord.gg/nzgMZJD)

# Credits

- [svelte](https://svelte.dev) and [vite](https://github.com/vitejs/vite#readme) creators, maintainers and contributors
- [rixo](https://github.com/rixo) - without svelte-hmr and your support this would not have been possible
- [intrnl](https://github.com/intrnl) - initial inspiration from https://github.com/intrnl/vite-plugin-svelte
