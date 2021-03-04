<h1><img width=24 alt="svite-logo" src="resources/svite-logo.svg" style="vertical-align: middle">&nbsp;svite&nbsp;<img width=24 alt="svite-logo" src="resources/svite-logo.svg" style="vertical-align: middle"></h1>

A fresh start for svite based on vite2 repo structure and setup

## Packages

- [@svitejs/vite-plugin-svelte](packages/vite-plugin-svelte) |

## Development

### dev

- run `yarn`to install
- run `yarn dev` in `packages/vite-plugin-svelte` to autobuild plugin
- run `yarn dev` in `packages/playground/xxx` to start vite

changes in plugin need restart of dev server

### some notes

- For typescript, svelte components must use `<script lang="ts">`, not `<script lang="typescript">` otherwise vite dep scan fails. see https://discord.com/channels/804011606160703521/804062134051930222/806300072349270033
- exclusions in optimizeDeps also cover children (x or startswith x+/)
- svelte components should be sorted with style nodes last as js code may contain markup node positions
