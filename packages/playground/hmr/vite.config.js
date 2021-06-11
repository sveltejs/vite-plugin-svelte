const { defineConfig } = require('vite');
const { svelte } = require('@sveltejs/vite-plugin-svelte');

module.exports = defineConfig(({ command, mode }) => {
	const isProduction = mode === 'production';
	return {
		optimizeDeps: {
			exclude: ['playground-hmr-test-dependency']
		},
		plugins: [svelte()],
		build: {
			minify: isProduction
		}
	};
});
