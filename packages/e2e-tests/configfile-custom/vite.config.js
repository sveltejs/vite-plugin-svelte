const { svelte } = require('@sveltejs/vite-plugin-svelte');
const { defineConfig } = require('vite');

module.exports = defineConfig(() => {
	return {
		root: './', // ensure custom root works, see https://github.com/sveltejs/vite-plugin-svelte/issues/113
		plugins: [svelte()],
		build: {
			// make build faster by skipping transforms and minification
			target: 'esnext',
			minify: false,
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
