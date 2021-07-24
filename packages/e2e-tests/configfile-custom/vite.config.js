const { svelte } = require('@sveltejs/vite-plugin-svelte');
const { defineConfig } = require('vite');

module.exports = defineConfig(() => {
	return {
		root: './', // ensure custom root works, see https://github.com/sveltejs/vite-plugin-svelte/issues/113
		plugins: [svelte({ configFile: 'svelte.config.custom.cjs' })],
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
