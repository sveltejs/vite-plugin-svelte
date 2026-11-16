import { defineConfig } from 'vite';
import { DevTools } from '@vitejs/devtools';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// no `inspector` option: with Vite DevTools the inspector is added to its dock
export default defineConfig({
	plugins: [DevTools({ clientAuth: false, apply: 'serve' }), svelte()]
});
