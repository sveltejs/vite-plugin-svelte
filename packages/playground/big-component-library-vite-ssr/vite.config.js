import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [svelte({ prebundleSvelteLibraries: true, compilerOptions: { hydratable: true } })],
	optimizeDeps: {
		include: ['carbon-components-svelte', 'carbon-icons-svelte']
	},
	ssr: {
		optimizeDeps: {
			include: ['carbon-components-svelte', 'carbon-icons-svelte']
		}
	}
});
