const { svelte } = require('@sveltejs/vite-plugin-svelte');
const { defineConfig } = require('vite');

module.exports = defineConfig(({ command, mode }) => {
	return {
		plugins: [
			svelte({
				disableDependencyReinclude: ['e2e-test-dep-svelte-hybrid']
			})
		],
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
