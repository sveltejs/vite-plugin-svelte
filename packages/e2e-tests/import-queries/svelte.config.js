import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
	preprocess: [vitePreprocess()],
	onwarn(warning, defaultHandler) {
		// import query test generates one of these
		if (warning.code === 'custom-element-no-tag') return;
		defaultHandler(warning);
	}
};
