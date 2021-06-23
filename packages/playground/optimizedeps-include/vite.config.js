import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
const SVELTE_IMPORTS = [
	'svelte/animate',
	'svelte/easing',
	'svelte/internal',
	'svelte/motion',
	'svelte/store',
	'svelte/transition',
	'svelte'
];
export default defineConfig(({ command, mode }) => {
	const isProduction = mode === 'production';
	return {
		optimizeDeps: {
			include: [...SVELTE_IMPORTS]
		},
		plugins: [svelte()],
		build: {
			minify: isProduction
		}
	};
});
