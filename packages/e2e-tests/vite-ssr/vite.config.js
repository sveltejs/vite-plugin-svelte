const { defineConfig } = require('vite');
const { svelte } = require('@sveltejs/vite-plugin-svelte');

module.exports = defineConfig(({ command, mode }) => {
	return {
		plugins: [
			svelte({
				compilerOptions: {
					hydratable: true /* required for clientside hydration */
				}
			})
		],
		ssr: {
			format: 'cjs'
		},
		build: {
			target: 'esnext',
			minify: false,
			assetsInlineLimit: 0
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
