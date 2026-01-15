import node from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: node()
	},
	compilerOptions: {
		cssHash({ css, hash }) {
			return `s-${hash(css)}`;
		}
	}
};
export default config;
