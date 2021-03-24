const svelte = require('@sveltejs/vite-plugin-svelte');
const { defineConfig } = require('vite');

module.exports = defineConfig(() => {
	const { preprocess } = require('./svelte.config');
	return {
		plugins: [svelte({ preprocess })]
	};
});
