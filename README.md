# vite-plugin-svelte

This is the official [svelte](https://svelte.dev) plugin for [vite](https://vitejs.dev)

## Packages

| Package                                                     | changelog                                             |
| ----------------------------------------------------------- | ----------------------------------------------------- |
| [@sveltejs/vite-plugin-svelte](packages/vite-plugin-svelte) | [changelog](packages/vite-plugin-svelte/CHANGELOG.md) |

# Got a question? / Need help?

Join [svelte discord](https://svelte.dev/chat)

## Development of vite-plugin-svelte

### dev

- run `pnpm i`to install
- run `pnpm dev` in `packages/vite-plugin-svelte` to autobuild plugin
- run `pnpm dev` in `packages/playground/xxx` to start vite

changes in plugin need restart of dev server

### some notes

- For typescript, svelte components must use `<script lang="ts">`, not `<script lang="typescript">` otherwise vite dep scan fails. see https://discord.com/channels/804011606160703521/804062134051930222/806300072349270033
- exclusions in optimizeDeps also cover children (x or startswith x+/)
- svelte components should be sorted with style nodes last as js code may contain markup node positions

# Credits

- [svelte](https://svelte.dev) and [vite](https://github.com/vitejs/vite#readme) creators, maintainers and contributors
- [rixo](https://github.com/rixo) - without svelte-hmr and your support this would not have been possible
- [intrnl](https://github.com/intrnl) - initial inspiration from https://github.com/intrnl/vite-plugin-svelte
