const { defineConfig } = require('vite');
const { svelte } = require('@sveltejs/vite-plugin-svelte');

module.exports = defineConfig(({ command, mode }) => {
	const isProduction = mode === 'production';
	return {
		optimizeDeps: {
			exclude: ['e2e-tests-hmr-test-dependency']
		},
		plugins: [svelte()],
		build: {
			minify: isProduction
		}
	};
});
