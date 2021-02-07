# svite

a fresh start for svite based on vite2 repo structure and setup

nothing is finished, right now this is a testbed to make vite-plugin-svelte work based on @rixo s fork of rollup-plugin-svelte



## dev
* run `yarn`to install
* run  `yarn dev` in `packages/vite-plugin-svelte` to autobuild plugin
* run `yarn dev` in `packages/playground/default-svelte-template` to start vite

changes in plugin need restart of dev server

## some notes

* For typescript, svelte components must use `<script lang="ts">`, not `<script lang="typescript">` otherwise vite dep scan fails. see https://discord.com/channels/804011606160703521/804062134051930222/806300072349270033
* exclusions in optimizeDeps also cover children (x or startswith x+/)