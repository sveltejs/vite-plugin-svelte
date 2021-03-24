const svelte = require('@sveltejs/vite-plugin-svelte');
const { defineConfig } = require('vite');
const vitePluginWindicss = require('vite-plugin-windicss').default;

module.exports = defineConfig(({ command, mode }) => {
	const isProduction = mode === 'production';
	return {
		plugins: [
			svelte(),
			vitePluginWindicss()
		],
		build: {
			minify: isProduction
		}
	};
});
