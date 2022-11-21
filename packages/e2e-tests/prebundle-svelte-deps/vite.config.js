import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [svelte()],
	optimizeDeps: {
		exclude: [
			// TODO this must be excluded because nested has an scss dep that prebundle can't handle!
			// figure out how to exclude it automatically or at least tell the user about it in a more friendly way
			'e2e-test-dep-scss-only',
			'e2e-test-dep-svelte-hybrid'
		]
	},
	build: {
		// make build faster by skipping transforms and minification
		target: 'esnext',
		minify: false
	},
	server: {
		watch: {
			// During tests we edit the files too fast and sometimes chokidar
			// misses change events, so enforce polling for consistency
			usePolling: true,
			interval: 100
		}
	}
});
