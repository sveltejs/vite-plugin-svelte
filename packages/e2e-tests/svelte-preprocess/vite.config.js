const { defineConfig } = require('vite');
const { svelte } = require('@sveltejs/vite-plugin-svelte');

module.exports = defineConfig(({ command, mode }) => {
	return {
		plugins: [svelte()],
		build: {
			// make build faster by skipping transforms and minification
			target: 'esnext',
			minify: false
		},
		server: {
			fs: {
				strict: true
			},
			watch: {
				// During tests we edit the files too fast and sometimes chokidar
				// misses change events, so enforce polling for consistency
				usePolling: true,
				interval: 100
			}
		}
	};
});
