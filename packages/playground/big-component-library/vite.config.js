import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [svelte({ prebundleSvelteLibraries: true })],
	optimizeDeps: {
		// carbon-components-svelte is large, prebundle
		include: ['carbon-components-svelte', 'carbon-icons-svelte'],
		// carbon-icons-svelte is huge and takes 12s to prebundle, better use deep imports for the icons you need
		exclude: []
	}
});
