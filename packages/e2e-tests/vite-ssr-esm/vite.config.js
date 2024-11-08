import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig(({ command, mode }) => {
	return {
		plugins: [svelte()],
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
		// TODO: investigate the condition issue. it's the same thing dominik and ben found.
		// idk why it's only happening after https://github.com/vitejs/vite/pull/18395
		ssr: {
			noExternal: ['esm-env']
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
