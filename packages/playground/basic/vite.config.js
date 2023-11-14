import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
	optimizeDeps: {
		include: ['e2e-test-dep-svelte-module']
	},
	plugins: [svelte()]
});
