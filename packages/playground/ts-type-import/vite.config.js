const svelte = require('@sveltejs/vite-plugin-svelte').default;
const { defineConfig } = require('vite');

module.exports = defineConfig(() => {
	return {
		plugins: [svelte()]
	};
});
