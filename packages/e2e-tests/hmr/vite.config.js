const { defineConfig } = require('vite');
const { svelte } = require('@sveltejs/vite-plugin-svelte');
const { transformValidation } = require('e2e-test-dep-vite-plugins');

module.exports = defineConfig(({ command, mode }) => {
	return {
		plugins: [transformValidation(), svelte()],
		build: {
			minify: false,
			target: 'esnext',
			commonjsOptions: {
				// pnpm only symlinks packages, and vite wont process cjs deps not in
				// node_modules, so we add the cjs dep here
				include: [/node_modules/, /cjs-only/]
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
