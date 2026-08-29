import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import globalData from '@csstools/postcss-global-data';
import mixins from '@csstools/postcss-mixins';

export default defineConfig(() => {
	return {
		plugins: [svelte()],
		css: {
			postcss: {
				plugins: [globalData({ files: ['src/mixins.pcss'] }), mixins()]
			}
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
	};
});
