export default {
	vitePlugin: {
		experimental: {
			useVitePreprocess: true
		}
	},
	onwarn(warning, defaultHandler) {
		// import query test generates one of these
		if (warning.code === 'custom-element-no-tag') return;
		defaultHandler(warning);
	}
};
