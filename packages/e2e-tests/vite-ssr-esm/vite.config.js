import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig(({ command, mode }) => {
	return {
		plugins: [
			svelte({
				compilerOptions: {
					hydratable: true /* required for clientside hydration */
				}
			})
		],
		build: {
			target: 'esnext',
			minify: false,
			assetsInlineLimit: 0,
			rollupOptions: {
				output: {
					format: 'esm'
				}
			}
		},
		server: {
			watch: {
				// During tests we edit the files too fast and sometimes chokidar
				// misses change events, so enforce polling for consistency
				usePolling: true,
				interval: 100
			}
		}
	};
});
