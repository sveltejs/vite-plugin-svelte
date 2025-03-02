import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { env } from 'node:process';
// https://vitejs.dev/config/
export default defineConfig({
	plugins: [svelte()]
});
