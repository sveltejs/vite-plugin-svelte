// eslint-disable-next-line node/no-missing-require
const { vitePreprocess } = require('@sveltejs/vite-plugin-svelte/preprocess');

module.exports = {
	preprocess: [vitePreprocess()]
};
