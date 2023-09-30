import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [svelte({ emitCss: true, experimental: { noCssModuleSideEffects: true } })],
	build: {
		minify: false,
		rollupOptions: {
			treeshake: {
				preset: 'smallest',
				moduleSideEffects: (id) => {
					if (id.endsWith('svelte&type=style&lang.css')) {
						return false; // DOES NOT WORK
					}
				}
			}
		}
	}
});
