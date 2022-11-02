// eslint-disable-next-line node/no-missing-require
const { viteScript, viteStyle } = require('@sveltejs/vite-plugin-svelte/preprocess');

module.exports = {
	preprocess: [viteScript(), viteStyle()]
};
