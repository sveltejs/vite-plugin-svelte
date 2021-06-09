const { defineConfig } = require('vite');
const svelte = require('@sveltejs/vite-plugin-svelte').default;

module.exports = defineConfig(({ command, mode }) => {
	const isProduction = mode === 'production';
	return {
		plugins: [svelte()],
		build: {
			minify: isProduction,
			assetsInlineLimit: 0
		}
	};
});
