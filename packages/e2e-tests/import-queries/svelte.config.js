import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
	preprocess: [vitePreprocess()],
	onwarn(warning, defaultHandler) {
		// import query test generates one of these
		if (warning.code === 'options_missing_custom_element') return;
		defaultHandler(warning);
	}
};
