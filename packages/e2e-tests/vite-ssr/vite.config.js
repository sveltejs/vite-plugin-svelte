const { defineConfig } = require('vite');
const { svelte } = require('@sveltejs/vite-plugin-svelte');

module.exports = defineConfig(({ command, mode }) => {
	const isProduction = mode === 'production';
	return {
		plugins: [
			svelte({
				compilerOptions: {
					hydratable: true /* required for clientside hydration */
				}
			})
		],
		build: {
			minify: isProduction,
			assetsInlineLimit: 0
		}
	};
});
