const { defineConfig } = require('vite');
const { svelte } = require('@sveltejs/vite-plugin-svelte');

module.exports = defineConfig(({ command, mode }) => {
	return {
		optimizeDeps: {
			exclude: ['e2e-tests-hmr-test-dependency']
		},
		plugins: [svelte()],
		build: {
			minify: false,
			target: 'esnext'
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
