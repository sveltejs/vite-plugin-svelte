const svelte = require('@sveltejs/vite-plugin-svelte');
const { defineConfig } = require('vite');

module.exports = defineConfig(() => {
	return {
		plugins: [svelte()]
	};
});
