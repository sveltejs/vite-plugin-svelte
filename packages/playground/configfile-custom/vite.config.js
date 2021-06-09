const svelte = require('@sveltejs/vite-plugin-svelte').default;
const { defineConfig } = require('vite');

module.exports = defineConfig(({ command, mode }) => {
	const isProduction = mode === 'production';
	return {
		plugins: [svelte({ configFile: 'svelte.config.custom.cjs' })],
		build: {
			minify: isProduction
		}
	};
});
