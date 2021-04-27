const sveltePreprocess = require('svelte-preprocess');
const path = require('path');
module.exports = {
	preprocess: sveltePreprocess({
		postcss: {
			// tests are run on project root and postcss-load-config uses cwd as default so force correct path here
			configFilePath: path.join(__dirname, 'postcss.config.js')
		}
	})
};
